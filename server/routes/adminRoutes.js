import express from "express";
import {
  getStats,
  getRestaurants,
  updateRestaurantStatus,
  toggleRestaurantActive,
  getUsers,
  toggleUserActive,
  getSettings,
  updateSettings,
  getReviews,
  removeReview,
  unflagReview,
  getDishes,
  verifyDishNutrition,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getStats);

router.get("/restaurants", getRestaurants);
router.patch("/restaurants/:id/status", updateRestaurantStatus);
router.patch("/restaurants/:id/toggle-active", toggleRestaurantActive);

router.get("/users", getUsers);
router.patch("/users/:id/toggle-active", toggleUserActive);

router.get("/reviews", getReviews);
router.delete("/reviews/:id", removeReview);
router.patch("/reviews/:id/unflag", unflagReview);

router.get("/dishes", getDishes);
router.patch("/dishes/:id/verify", verifyDishNutrition);

router.route("/settings").get(getSettings).put(updateSettings);

export default router;