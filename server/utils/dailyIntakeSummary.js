import MealLog from "../models/MealLog.js";
import Dish from "../models/Dish.js";
import Restaurant from "../models/Restaurant.js";
import { applyDietaryFilter } from "./applyDietaryFilter.js";

// M3-1 / M3-2 (Mostahid) — shared by the AI Nutrition Assistant and AI Food
// Image Recognition so both ground their suggestions in the same "today's
// remaining calories" math and the same real platform catalogue (never
// hallucinated dishes). Mirrors the UTC-day convention already used in
// nutritionController.js and recommendationController.js.

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Calories already logged today vs. the user's goal.
export const getRemainingCalories = async (user) => {
  const goal = user.dailyCalorieGoal || 2000;
  const logs = await MealLog.find({
    user: user._id,
    loggedAt: { $gte: startOfToday() },
  }).select("nutrition.calories");

  const consumed = logs.reduce((sum, l) => sum + (l.nutrition?.calories || 0), 0);
  return { goal, consumed: Math.round(consumed), remaining: Math.max(0, Math.round(goal - consumed)) };
};

// Dishes from approved, active restaurants, already passed through the
// user's dietary preference / allergy filter (M1-3) — this is the "platform
// catalogue" both AI features are required to suggest from.
export const getCandidateDishes = async (user, { maxCalories, limit = 8 } = {}) => {
  const restaurants = await Restaurant.find({ status: "approved", isActive: true }).select("_id");
  const restaurantIds = restaurants.map((r) => r._id);

  const dishes = await Dish.find({
    restaurant: { $in: restaurantIds },
    isAvailable: true,
  }).populate("restaurant", "businessName city");

  const { visible } = applyDietaryFilter(dishes, user);

  const withinBudget = maxCalories
    ? visible.filter((d) => (d.nutrition?.calories || 0) <= maxCalories)
    : visible;

  return withinBudget
    .sort((a, b) => (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0))
    .slice(0, limit);
};
