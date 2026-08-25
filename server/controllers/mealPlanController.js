import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import MealPlan from "../models/MealPlan.js";
import Dish from "../models/Dish.js";

// ─────────────────────────────────────────────────────────────
// Helper — compute calorie + macro + cost totals for one day
// ─────────────────────────────────────────────────────────────

const getDailyTotals = async (meals) => {
  // Get unique dish IDs, then fetch once
  const uniqueIds = [...new Set(meals.map((m) => m.dish.toString()))];
  const dishDocs = await Dish.find({ _id: { $in: uniqueIds } });

  // Build a lookup map: id -> dish document
  const dishMap = {};
  dishDocs.forEach((d) => {
    dishMap[d._id.toString()] = d;
  });

  // Iterate over EVERY meal entry (including duplicates)
  const totals = meals.reduce(
    (acc, meal) => {
      const dish = dishMap[meal.dish.toString()];
      if (!dish) return acc;
      const n = dish.nutrition;
      acc.calories += n.calories;
      acc.protein += n.protein;
      acc.carbohydrates += n.carbohydrates;
      acc.fat += n.fat;
      acc.sugar += n.sugar;
      acc.sodium += n.sodium;
      acc.fiber += n.fiber;
      acc.cost += dish.price;
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      sugar: 0,
      sodium: 0,
      fiber: 0,
      cost: 0,
    }
  );

  return totals;
};

// ─────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────

// @desc   Get all meal plans for the logged-in user
// @route  GET /api/meal-planner/my-plans
// @access Private
export const getMyMealPlans = asyncHandler(async (req, res) => {
  const plans = await MealPlan.find({ user: req.user._id })
    .select("name dailyCalorieTarget budgetPerDay isActive createdAt")
    .sort({ createdAt: -1 });

  res.json({ success: true, plans });
});

// @desc   Get a single meal plan with computed daily totals
// @route  GET /api/meal-planner/:id
// @access Private
export const getMealPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid meal plan ID");
  }

  const plan = await MealPlan.findOne({ _id: id, user: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error("Meal plan not found");
  }

  const planObj = plan.toObject();
  const planWithTotals = {
    ...planObj,
    days: await Promise.all(
      planObj.days.map(async (day) => ({
        ...day,
        totals: await getDailyTotals(day.meals),
        effectiveCalorieTarget:
          day.calorieTarget > 0 ? day.calorieTarget : plan.dailyCalorieTarget,
        effectiveBudget:
          day.budgetTarget > 0 ? day.budgetTarget : plan.budgetPerDay,
      }))
    ),
  };

  res.json({ success: true, plan: planWithTotals });
});

// @desc   Create a new meal plan
// @route  POST /api/meal-planner
// @access Private
export const createMealPlan = asyncHandler(async (req, res) => {
  const { name, dailyCalorieTarget, budgetPerDay, days } = req.body;

  if (!name || !dailyCalorieTarget) {
    res.status(400);
    throw new Error("Name and calorie target are required");
  }

  const plan = await MealPlan.create({
    user: req.user._id,
    name,
    dailyCalorieTarget,
    budgetPerDay: budgetPerDay || 0,
    days: days || [],
  });

  res.status(201).json({ success: true, plan });
});

// @desc   Update a meal plan
// @route  PUT /api/meal-planner/:id
// @access Private
export const updateMealPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid meal plan ID");
  }

  const plan = await MealPlan.findOne({ _id: id, user: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error("Meal plan not found");
  }

  const { name, dailyCalorieTarget, budgetPerDay, days, isActive } = req.body;

  if (name) plan.name = name;
  if (dailyCalorieTarget) plan.dailyCalorieTarget = dailyCalorieTarget;
  if (budgetPerDay !== undefined) plan.budgetPerDay = budgetPerDay;
  if (days) plan.days = days;
  if (isActive !== undefined) plan.isActive = isActive;

  await plan.save();

  res.json({ success: true, plan });
});

// @desc   Delete a meal plan
// @route  DELETE
// @route  DELETE /api/meal-planner/:id
// @access Private
export const deleteMealPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid meal plan ID");
  }

  const plan = await MealPlan.findOne({ _id: id, user: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error("Meal plan not found");
  }

  await plan.deleteOne();

  res.json({ success: true, id });
});