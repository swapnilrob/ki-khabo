import asyncHandler from "express-async-handler";
import Dish from "../models/Dish.js";
import Restaurant from "../models/Restaurant.js";
import MealLog from "../models/MealLog.js";
import { applyDietaryFilter } from "../utils/applyDietaryFilter.js";

// Which dish categories suit which time of day. Soft scoring signal, not a hard filter.
const MEAL_CATEGORIES = {
  breakfast: ["beverage", "main", "side"],
  lunch: ["main", "combo", "appetizer"],
  dinner: ["main", "combo", "appetizer", "dessert"],
  snacks: ["appetizer", "side", "dessert", "beverage"],
};

const currentMealTime = () => {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 22) return "dinner";
  return "snacks";
};

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// @desc   Personalized dish recommendations (M2-2)
// @route  GET /api/recommendations
// @access Private (user)
export const getRecommendations = asyncHandler(async (req, res) => {
  const user = req.user; // set by `protect` — full user doc incl. prefs & goal

  const mealTime = MEAL_CATEGORIES[req.query.mealTime]
    ? req.query.mealTime
    : currentMealTime();
  const maxPrice = parseFloat(req.query.maxPrice); // NaN if not provided
  const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 12));

  // 1) Calories left today = goal − already logged (Mostahid's MealLog)
  const goal = user.dailyCalorieGoal || 2000;
  const todaysLogs = await MealLog.find({
    user: user._id,
    loggedAt: { $gte: startOfToday() },
  }).select("nutrition.calories");
  const consumed = todaysLogs.reduce((sum, l) => sum + (l.nutrition?.calories || 0), 0);
  const remainingCalories = Math.max(0, goal - consumed);

  // 2) Candidate pool — available dishes from approved, active restaurants
  const openRestaurants = await Restaurant.find({
    status: "approved",
    isActive: true,
  }).select("_id");
  const restaurantIds = openRestaurants.map((r) => r._id);

  const candidates = await Dish.find({
    restaurant: { $in: restaurantIds },
    isAvailable: true,
  }).populate("restaurant", "businessName city priceRange averageRating location");

  // 3) Safety + dietary filter (HARD) — reuse Mostahid's util
  const { visible } = applyDietaryFilter(candidates, user);

  // 4) Budget (HARD, only if provided)
  const affordable = Number.isNaN(maxPrice)
    ? visible
    : visible.filter((d) => d.price <= maxPrice);

  // 5) Score each dish
  const wantedCats = MEAL_CATEGORIES[mealTime];
  const scored = affordable.map((dish) => {
    let score = 0;
    const reasons = [];

    score += (dish.averageRating || 0) * 5;
    score += Math.min(10, dish.totalReviews || 0);
    if (dish.averageRating >= 4) reasons.push("Highly rated");

    const cal = dish.nutrition?.calories || 0;
    if (remainingCalories > 0) {
      if (cal > 0 && cal <= remainingCalories) {
        score += 20;
        reasons.push("Fits your calorie budget");
      } else if (cal > remainingCalories) {
        score -= 15;
      }
    }

    if (wantedCats.includes(dish.category)) {
      score += 12;
      reasons.push(`Good for ${mealTime}`);
    }

    if ((user.dietaryPreferences || []).length) reasons.push("Matches your diet");

    // TODO (after M3-4 Order & Booking): add order-history boost here.

    return { dish, score, reasons };
  });

  // 6) Rank + take top N
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  res.json({
    success: true,
    context: {
      mealTime,
      dailyCalorieGoal: goal,
      consumedToday: consumed,
      remainingCalories,
      maxPrice: Number.isNaN(maxPrice) ? null : maxPrice,
    },
    count: top.length,
    recommendations: top.map(({ dish, score, reasons }) => ({
      _id: dish._id,
      name: dish.name,
      price: dish.price,
      category: dish.category,
      nutrition: dish.nutrition,
      dietaryTags: dish.dietaryTags,
      averageRating: dish.averageRating,
      restaurant: dish.restaurant,
      score: Math.round(score),
      reasons: reasons.slice(0, 3),
    })),
  });
});