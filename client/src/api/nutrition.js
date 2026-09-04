import api from "./axios";

// M2-1 — Nutritional Tracking & Health Dashboard

export const fetchGoal = () => api.get("/nutrition/goal").then((r) => r.data);

export const updateGoal = (dailyCalorieGoal) =>
  api.put("/nutrition/goal", { dailyCalorieGoal }).then((r) => r.data);

export const logMeal = (dishId, servings = 1, restaurantId) =>
  api.post("/nutrition/log", { dishId, servings, restaurantId }).then((r) => r.data);

export const fetchMealLogs = (date) =>
  api.get("/nutrition/log", { params: date ? { date } : {} }).then((r) => r.data);

export const deleteMealLog = (id) =>
  api.delete(`/nutrition/log/${id}`).then((r) => r.data);

export const fetchDailySummary = (date) =>
  api.get("/nutrition/summary/daily", { params: date ? { date } : {} }).then((r) => r.data);

export const fetchWeeklySummary = (end) =>
  api.get("/nutrition/summary/weekly", { params: end ? { end } : {} }).then((r) => r.data);

export const fetchMonthSummary = (month) =>
  api.get("/nutrition/summary/month", { params: month ? { month } : {} }).then((r) => r.data);
