import express from "express";
import {
  getMenuOverview,
  getDishRankings,
  getRatingTrend,
  getReviewSummary,
} from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("owner"));

router.get("/menu-overview", getMenuOverview);
router.get("/dish-rankings", getDishRankings);
router.get("/rating-trend", getRatingTrend);
router.get("/review-summary", getReviewSummary);

export default router;