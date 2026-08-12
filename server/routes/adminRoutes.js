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
router.route("/settings").get(getSettings).put(updateSettings);

export default router;