import express from "express";
import {
  getMenuOverview,
  getDishRankings,
  getRatingTrend,
  getReviewSummary,
  getOrderOverview,
  getBestSellers,
  getRevenueTrend,
} from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("owner"));

router.get("/menu-overview", getMenuOverview);
router.get("/dish-rankings", getDishRankings);
router.get("/rating-trend", getRatingTrend);
router.get("/review-summary", getReviewSummary);
router.get("/order-overview", getOrderOverview);
router.get("/best-sellers", getBestSellers);
router.get("/revenue-trend", getRevenueTrend);

export default router;