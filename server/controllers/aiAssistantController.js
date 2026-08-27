import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import { calculateDailyCalorieTarget, ACTIVITY_LEVELS, GOALS } from "../utils/calorieCalculator.js";
import { getRemainingCalories, getCandidateDishes } from "../utils/dailyIntakeSummary.js";
import { getOpenAIClient, AI_MODEL } from "../utils/openaiClient.js";

// M3-1 — AI Nutrition & Diet Assistant (Mostahid)
// Every route here is Premium-only (enforced by aiAssistantRoutes.js).

const publicDishSummary = (d) => ({
  id: d._id,
  name: d.name,
  calories: d.nutrition?.calories || 0,
  price: d.price,
  restaurantId: d.restaurant?._id,
  restaurantName: d.restaurant?.businessName,
});

// ─────────────────────────────────────────────────────────────
// HEALTH PROFILE (BMR/TDEE inputs)
// ─────────────────────────────────────────────────────────────

// @desc   Get the user's health profile + calculated calorie target
// @route  GET /api/ai-assistant/health-profile
// @access Private/User + Premium
export const getHealthProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("healthProfile dailyCalorieGoal");
  const calorieInfo = calculateDailyCalorieTarget(user.healthProfile);
  res.json({ success: true, healthProfile: user.healthProfile, calorieInfo, currentGoal: user.dailyCalorieGoal });
});

// @desc   Update the user's health profile (height, weight, age, sex, activity, goal)
// @route  PUT /api/ai-assistant/health-profile
// @access Private/User + Premium
export const updateHealthProfile = asyncHandler(async (req, res) => {
  const { heightCm, weightKg, age, sex, activityLevel, goal } = req.body;

  if (activityLevel !== undefined && !ACTIVITY_LEVELS.includes(activityLevel)) {
    res.status(400);
    throw new Error(`Invalid activityLevel — must be one of: ${ACTIVITY_LEVELS.join(", ")}`);
  }
  if (goal !== undefined && !GOALS.includes(goal)) {
    res.status(400);
    throw new Error(`Invalid goal — must be one of: ${GOALS.join(", ")}`);
  }
  if (sex !== undefined && sex !== null && !["male", "female"].includes(sex)) {
    res.status(400);
    throw new Error("Invalid sex — must be 'male' or 'female'");
  }

  const user = await User.findById(req.user._id);
  if (!user.healthProfile) user.healthProfile = {};

  if (heightCm !== undefined) user.healthProfile.heightCm = heightCm;
  if (weightKg !== undefined) user.healthProfile.weightKg = weightKg;
  if (age !== undefined) user.healthProfile.age = age;
  if (sex !== undefined) user.healthProfile.sex = sex;
  if (activityLevel !== undefined) user.healthProfile.activityLevel = activityLevel;
  if (goal !== undefined) user.healthProfile.goal = goal;

  await user.save();

  const calorieInfo = calculateDailyCalorieTarget(user.healthProfile);
  res.json({ success: true, healthProfile: user.healthProfile, calorieInfo });
});

// @desc   Apply the calculated calorie target as the user's Health Dashboard goal
// @route  POST /api/ai-assistant/apply-target-goal
// @access Private/User + Premium
export const applyTargetGoal = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const calorieInfo = calculateDailyCalorieTarget(user.healthProfile);

  if (!calorieInfo.isComplete) {
    res.status(400);
    throw new Error(
      `Complete your health profile first — missing: ${calorieInfo.missingFields.join(", ")}`
    );
  }

  user.dailyCalorieGoal = calorieInfo.target;
  await user.save();

  res.json({ success: true, dailyCalorieGoal: user.dailyCalorieGoal, calorieInfo });
});

// ─────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────

const buildSystemPrompt = (user, calorieInfo, remaining, candidates) => {
  const prefs = user.dietaryPreferences?.length ? user.dietaryPreferences.join(", ") : "none";
  const allergies = user.allergies?.length ? user.allergies.join(", ") : "none";

  const dishList = candidates.length
    ? candidates
        .map(
          (d) =>
            `- "${d.name}" at ${d.restaurant?.businessName || "a restaurant"}: ${d.nutrition?.calories || 0} kcal, ৳${d.price}`
        )
        .join("\n")
    : "(no matching dishes found in the catalogue right now — say so honestly rather than inventing any)";

  const goalLine = calorieInfo.isComplete
    ? `Daily calorie target: ${calorieInfo.target} kcal (BMR ${calorieInfo.bmr}, TDEE ${calorieInfo.tdee})`
    : `Daily calorie target: not calculated yet — missing profile info: ${calorieInfo.missingFields.join(", ")}. Gently ask for these if relevant.`;

  return `You are Ki Khabo's AI Nutrition & Diet Assistant — a friendly, encouraging nutrition coach embedded in a food-discovery platform in Bangladesh.

USER PROFILE
- Stated goal: ${user.healthProfile?.goal || "not set"}
- ${goalLine}
- Consumed so far today: ${remaining.consumed} kcal
- Remaining today: ${remaining.remaining} kcal
- Dietary preferences: ${prefs}
- Allergies: ${allergies}

DISHES CURRENTLY AVAILABLE ON THE PLATFORM (already filtered for this user's allergies/diet, cheapest-calorie first):
${dishList}

RULES
- Only ever recommend dishes from the list above by their exact name — never invent food that isn't in the catalogue.
- If remaining calories are low, prioritize the lower-calorie dishes from the list.
- Keep replies concise (3-6 sentences unless the user asks for more detail), warm, and practical.
- Never give medical diagnoses or replace professional medical advice — suggest seeing a doctor or dietitian for medical concerns.
- If asked something unrelated to nutrition, diet, or the platform, gently redirect back on topic.`;
};

// @desc   Send a message to the AI Nutrition Assistant
// @route  POST /api/ai-assistant/chat
// @access Private/User + Premium
export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("Message is required");
  }

  const user = req.user;
  const calorieInfo = calculateDailyCalorieTarget(user.healthProfile);
  const remaining = await getRemainingCalories(user);
  const candidates = await getCandidateDishes(user, {
    maxCalories: remaining.remaining > 0 ? remaining.remaining : undefined,
    limit: 8,
  });

  const history = await ChatMessage.find({ user: user._id }).sort({ createdAt: 1 }).limit(20);
  const systemPrompt = buildSystemPrompt(user, calorieInfo, remaining, candidates);

  let completion;
  try {
    const openai = getOpenAIClient();
    completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message.trim() },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
  } catch (err) {
    res.status(err.statusCode || 502);
    throw new Error("AI Nutrition Assistant is temporarily unavailable: " + err.message);
  }

  const reply = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response — please try again.";

  await ChatMessage.create({ user: user._id, role: "user", content: message.trim() });
  const assistantMsg = await ChatMessage.create({
    user: user._id,
    role: "assistant",
    content: reply,
    suggestedDishes: candidates.map((d) => d._id),
  });

  res.json({
    success: true,
    reply,
    messageId: assistantMsg._id,
    calorieInfo,
    remaining,
    suggestedDishes: candidates.map(publicDishSummary),
  });
});

// @desc   Get full chat history
// @route  GET /api/ai-assistant/chat
// @access Private/User + Premium
export const getChatHistory = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 });
  res.json({ success: true, messages });
});

// @desc   Clear chat history (start fresh)
// @route  DELETE /api/ai-assistant/chat
// @access Private/User + Premium
export const clearChatHistory = asyncHandler(async (req, res) => {
  await ChatMessage.deleteMany({ user: req.user._id });
  res.json({ success: true, message: "Chat history cleared" });
});
