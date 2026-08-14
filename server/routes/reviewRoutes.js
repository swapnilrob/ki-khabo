import express from "express";
import {
  createReview,
  getRestaurantReviews,
  getDishReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  respondToReview,
} from "../controllers/reviewController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public reads (anyone can browse reviews before signing up) ──
router.get("/restaurant/:restaurantId", getRestaurantReviews);
router.get("/dish/:dishId", getDishReviews);

// ── Logged-in user actions ──
router.get("/mine", protect, authorize("user"), getMyReviews);
router.post("/", protect, authorize("user"), createReview);
router.put("/:id", protect, authorize("user"), updateReview);
router.delete("/:id", protect, authorize("user"), deleteReview);

// ── Owner action ──
router.put("/:id/response", protect, authorize("owner"), respondToReview);

export default router; 