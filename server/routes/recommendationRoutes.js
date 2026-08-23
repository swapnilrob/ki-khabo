import express from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Recommendations are personal — must be a logged-in food-seeker.
router.get("/", protect, authorize("user"), getRecommendations);

export default router;