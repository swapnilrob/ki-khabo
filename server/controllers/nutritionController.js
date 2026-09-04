import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import MealLog from "../models/MealLog.js";
import Dish from "../models/Dish.js";
import User from "../models/User.js";

// M2-1 — Nutritional Tracking & Health Dashboard (Mostahid)
//
// Every route in this file is scoped to req.user._id (enforced by
// nutritionRoutes.js) — a user only ever sees/edits their own logs and goal.

const MACROS = ["calories", "protein", "carbohydrates", "fat", "sugar", "fiber"];

const zeroTotals = () => MACROS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {});

const sumMacros = (logs) =>
  logs.reduce((totals, log) => {
    MACROS.forEach((k) => {
      totals[k] += log.nutrition?.[k] || 0;
    });
    return totals;
  }, zeroTotals());

// "YYYY-MM-DD" -> [startOfDayUTC, endOfDayUTC). Defaults to today (UTC).
// Note: dates are treated as UTC calendar days for simplicity — good enough
// for a class project, but a production app would use the user's timezone.
const dayRange = (dateStr) => {
  const start = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
  if (!dateStr) start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return [start, end];
};

// ─────────────────────────────────────────────────────────────
// MEAL LOGGING
// ─────────────────────────────────────────────────────────────

// @desc   Log a meal (a dish the user just ate)
// @route  POST /api/nutrition/log
// @access Private/User
export const logMeal = asyncHandler(async (req, res) => {
  const { dishId, servings = 1, restaurantId } = req.body;

  if (!dishId) {
    res.status(400);
    throw new Error("dishId is required");
  }
  if (!mongoose.Types.ObjectId.isValid(dishId)) {
    res.status(400);
    throw new Error("Invalid dish id");
  }
  if (servings <= 0) {
    res.status(400);
    throw new Error("Servings must be greater than 0");
  }

  const dish = await Dish.findById(dishId);
  if (!dish) {
    res.status(404);
    throw new Error("Dish not found");
  }

  // Snapshot nutrition scaled by servings — never trust client-submitted
  // macros, always derive them from the dish's own stored values.
  const nutrition = MACROS.reduce((acc, key) => {
    acc[key] = Math.round((dish.nutrition?.[key] || 0) * servings * 100) / 100;
    return acc;
  }, {});

  const log = await MealLog.create({
    user: req.user._id,
    dish: dish._id,
    restaurant: restaurantId || dish.restaurant,
    dishName: dish.name,
    servings,
    nutrition,
  });

  res.status(201).json({ success: true, log });
});

// @desc   List logged meals for a given day (defaults to today)
// @route  GET /api/nutrition/log?date=YYYY-MM-DD
// @access Private/User
export const getMealLogs = asyncHandler(async (req, res) => {
  const [start, end] = dayRange(req.query.date);

  const logs = await MealLog.find({
    user: req.user._id,
    loggedAt: { $gte: start, $lt: end },
  }).sort({ loggedAt: -1 });

  res.json({ success: true, date: start.toISOString().slice(0, 10), logs });
});

// @desc   Remove a logged meal (fix a mis-log)
// @route  DELETE /api/nutrition/log/:id
// @access Private/User
export const deleteMealLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid log id");
  }

  const log = await MealLog.findOne({ _id: id, user: req.user._id });
  if (!log) {
    res.status(404);
    throw new Error("Log entry not found");
  }

  await log.deleteOne();
  res.json({ success: true, message: "Log entry removed", id });
});

// ─────────────────────────────────────────────────────────────
// SUMMARIES
// ─────────────────────────────────────────────────────────────

// @desc   Daily intake totals vs. the user's calorie goal
// @route  GET /api/nutrition/summary/daily?date=YYYY-MM-DD
// @access Private/User
export const getDailySummary = asyncHandler(async (req, res) => {
  const [start, end] = dayRange(req.query.date);

  const [logs, user] = await Promise.all([
    MealLog.find({ user: req.user._id, loggedAt: { $gte: start, $lt: end } }),
    User.findById(req.user._id).select("dailyCalorieGoal"),
  ]);

  const totals = sumMacros(logs);
  const goal = user.dailyCalorieGoal;

  res.json({
    success: true,
    date: start.toISOString().slice(0, 10),
    goal,
    totals,
    remaining: Math.max(goal - totals.calories, 0),
    percentOfGoal: goal > 0 ? Math.round((totals.calories / goal) * 100) : 0,
    mealCount: logs.length,
  });
});

// @desc   7-day rolling nutrition summary, zero-filled, for the progress chart
// @route  GET /api/nutrition/summary/weekly?end=YYYY-MM-DD
// @access Private/User
export const getWeeklySummary = asyncHandler(async (req, res) => {
  const endDateStr = req.query.end;
  const endDay = endDateStr ? new Date(`${endDateStr}T00:00:00.000Z`) : new Date();
  if (!endDateStr) endDay.setUTCHours(0, 0, 0, 0);

  const startDay = new Date(endDay);
  startDay.setUTCDate(startDay.getUTCDate() - 6); // 7-day window, inclusive of endDay

  const rangeEnd = new Date(endDay);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

  const logs = await MealLog.find({
    user: req.user._id,
    loggedAt: { $gte: startDay, $lt: rangeEnd },
  });

  // Bucket into 7 calendar days, zero-filled, so the chart never has gaps
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDay);
    d.setUTCDate(d.getUTCDate() + i);
    days.push({ date: d.toISOString().slice(0, 10), ...zeroTotals(), mealCount: 0 });
  }

  logs.forEach((log) => {
    const key = log.loggedAt.toISOString().slice(0, 10);
    const bucket = days.find((d) => d.date === key);
    if (!bucket) return;
    MACROS.forEach((m) => {
      bucket[m] += log.nutrition?.[m] || 0;
    });
    bucket.mealCount += 1;
  });

  const user = await User.findById(req.user._id).select("dailyCalorieGoal");

  res.json({ success: true, goal: user.dailyCalorieGoal, days });
});

// @desc   Which dates in a month have logged meals, for the calendar view
// @route  GET /api/nutrition/summary/month?month=YYYY-MM
// @access Private/User
export const getMonthSummary = asyncHandler(async (req, res) => {
  const monthStr = req.query.month;
  const now = new Date();
  const [y, m] =
    monthStr && /^\d{4}-\d{2}$/.test(monthStr)
      ? monthStr.split("-").map(Number)
      : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1)); // first day of next month

  const logs = await MealLog.find({
    user: req.user._id,
    loggedAt: { $gte: start, $lt: end },
  }).select("loggedAt nutrition.calories");

  const byDate = {};
  logs.forEach((log) => {
    const key = log.loggedAt.toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = { date: key, calories: 0, mealCount: 0 };
    byDate[key].calories += log.nutrition?.calories || 0;
    byDate[key].mealCount += 1;
  });

  res.json({
    success: true,
    month: `${y}-${String(m).padStart(2, "0")}`,
    days: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
  });
});

// ─────────────────────────────────────────────────────────────
// GOAL
// ─────────────────────────────────────────────────────────────

// @desc   Get the user's daily calorie goal
// @route  GET /api/nutrition/goal
// @access Private/User
export const getGoal = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("dailyCalorieGoal");
  res.json({ success: true, dailyCalorieGoal: user.dailyCalorieGoal });
});

// @desc   Set the user's daily calorie goal
// @route  PUT /api/nutrition/goal
// @access Private/User
export const updateGoal = asyncHandler(async (req, res) => {
  const { dailyCalorieGoal } = req.body;

  if (!dailyCalorieGoal || dailyCalorieGoal < 800 || dailyCalorieGoal > 8000) {
    res.status(400);
    throw new Error("Daily calorie goal must be between 800 and 8000");
  }

  const user = await User.findById(req.user._id);
  user.dailyCalorieGoal = dailyCalorieGoal;
  await user.save();

  res.json({ success: true, dailyCalorieGoal: user.dailyCalorieGoal });
});
