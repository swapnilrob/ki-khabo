import express from "express";
import {
  getPlans,
  subscribe,
  getStatus,
  getHistory,
  cancelSubscription,
} from "../controllers/subscriptionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/plans", getPlans);
router.post("/subscribe", protect, authorize("user"), subscribe);
router.get("/status", protect, getStatus);
router.get("/history", protect, getHistory);
router.post("/cancel", protect, authorize("user"), cancelSubscription);

export default router; 