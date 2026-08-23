import express from "express";
import {
  getMyMealPlans,
  getMealPlanById,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../controllers/mealPlanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Every route requires login
router.use(protect);

router.get("/my-plans", getMyMealPlans);
router.post("/", createMealPlan);
router.get("/:id", getMealPlanById);
router.put("/:id", updateMealPlan);
router.delete("/:id", deleteMealPlan);

export default router;