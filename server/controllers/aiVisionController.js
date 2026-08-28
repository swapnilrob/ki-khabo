import asyncHandler from "express-async-handler";
import MealLog from "../models/MealLog.js";
import { getOpenAIClient, AI_MODEL } from "../utils/openaiClient.js";
import { getRemainingCalories, getCandidateDishes } from "../utils/dailyIntakeSummary.js";

// M3-2 — AI Food Image Recognition (Mostahid)
// Every route here is Premium-only (enforced by aiVisionRoutes.js).

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — comfortably covers a phone photo for this project's scope
const NUMERIC_FIELDS = ["calories", "protein", "carbohydrates", "fat", "sugar", "fiber"];

const RECOGNITION_SYSTEM_PROMPT = `You are a food recognition system for Ki Khabo, a Bangladeshi food-discovery platform.
Given a photo of a meal, identify the food and estimate its nutrition for the visible portion.
Respond with ONLY a JSON object — no markdown fences, no explanation — in exactly this shape:
{
  "foodName": string,
  "estimatedServing": string,
  "calories": number,
  "protein": number,
  "carbohydrates": number,
  "fat": number,
  "sugar": number,
  "fiber": number,
  "confidence": "low" | "medium" | "high"
}
All nutrition numbers are grams except calories (kcal). If you cannot identify any food in the image, set foodName to "Unrecognized" and confidence to "low", with all numbers 0.`;

// Exported so it can be unit-tested in isolation without a real API call.
export const validateImageBase64 = (imageBase64) => {
  if (!imageBase64 || typeof imageBase64 !== "string") return "imageBase64 is required";
  if (!imageBase64.startsWith("data:image/")) return "imageBase64 must be a data URL (data:image/...)";

  const commaIdx = imageBase64.indexOf(",");
  const b64 = commaIdx >= 0 ? imageBase64.slice(commaIdx + 1) : "";
  if (!b64) return "imageBase64 has no data after the comma";

  const approxBytes = Math.ceil((b64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) return "Image is too large (max 5MB)";

  return null;
};

// Exported so it can be unit-tested against sample model output without
// hitting the real OpenAI API.
export const parseRecognitionResult = (raw) => {
  let text = (raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const err = new Error("Could not parse the AI's response as JSON");
    err.statusCode = 502;
    throw err;
  }

  const result = {
    foodName: String(parsed.foodName || "Unrecognized").slice(0, 120),
    estimatedServing: String(parsed.estimatedServing || "").slice(0, 60),
    confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
  };

  NUMERIC_FIELDS.forEach((key) => {
    const n = Number(parsed[key]);
    result[key] = Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
  });

  return result;
};

// @desc   Identify a meal photo and estimate its nutrition
// @route  POST /api/ai-vision/recognize
// @access Private/User + Premium
export const recognizeFood = asyncHandler(async (req, res) => {
  const { imageBase64 } = req.body;
  const validationError = validateImageBase64(imageBase64);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  let completion;
  try {
    const openai = getOpenAIClient();
    completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: RECOGNITION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this meal and estimate its nutrition." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.2,
    });
  } catch (err) {
    res.status(err.statusCode || 502);
    throw new Error("Food recognition service is temporarily unavailable: " + err.message);
  }

  const raw = completion.choices[0]?.message?.content || "";
  const recognized = parseRecognitionResult(raw);

  const remaining = await getRemainingCalories(req.user);
  const exceedsRemaining = recognized.calories > remaining.remaining;

  // Only bother suggesting alternatives when the meal actually blows the
  // budget — no point suggesting anything if there's no calorie room left.
  let alternatives = [];
  if (exceedsRemaining && remaining.remaining > 0) {
    const candidates = await getCandidateDishes(req.user, { maxCalories: remaining.remaining, limit: 5 });
    alternatives = candidates.map((d) => ({
      id: d._id,
      name: d.name,
      calories: d.nutrition?.calories || 0,
      price: d.price,
      restaurantId: d.restaurant?._id,
      restaurantName: d.restaurant?.businessName,
    }));
  }

  res.json({ success: true, recognized, remaining, exceedsRemaining, alternatives });
});

// @desc   Save a recognized meal into the Health Dashboard's meal log —
//         "effortless meal logging without manual data entry"
// @route  POST /api/ai-vision/log
// @access Private/User + Premium
export const logRecognizedMeal = asyncHandler(async (req, res) => {
  const { foodName, calories, protein, carbohydrates, fat, sugar, fiber, servings = 1 } = req.body;

  if (!foodName || !String(foodName).trim()) {
    res.status(400);
    throw new Error("foodName is required");
  }
  if (servings <= 0) {
    res.status(400);
    throw new Error("Servings must be greater than 0");
  }

  const scale = (n) => Math.round((Number(n) || 0) * servings * 100) / 100;

  const log = await MealLog.create({
    user: req.user._id,
    dishName: `${foodName} (AI recognized)`,
    servings,
    nutrition: {
      calories: scale(calories),
      protein: scale(protein),
      carbohydrates: scale(carbohydrates),
      fat: scale(fat),
      sugar: scale(sugar),
      fiber: scale(fiber),
    },
  });

  res.status(201).json({ success: true, log });
});
