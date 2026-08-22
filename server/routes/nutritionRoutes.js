import express from "express";
import {
  logMeal,
  getMealLogs,
  deleteMealLog,
  getDailySummary,
  getWeeklySummary,
  getGoal,
  updateGoal,
} from "../controllers/nutritionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// M2-1 (Mostahid) — every route here is a food-seeker's own nutrition data
router.use(protect, authorize("user"));

router.get("/goal", getGoal);
router.put("/goal", updateGoal);

router.post("/log", logMeal);
router.get("/log", getMealLogs);
router.delete("/log/:id", deleteMealLog);

router.get("/summary/daily", getDailySummary);
router.get("/summary/weekly", getWeeklySummary);

export default router;
