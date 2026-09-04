import express from "express";
import {
  getPlans,
  createCheckout,
  verifyCheckout,
  getStatus,
  getHistory,
  cancelSubscription,
} from "../controllers/subscriptionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/plans", getPlans);
router.post("/create-checkout", protect, authorize("user"), createCheckout);
router.post("/verify", protect, verifyCheckout);
router.get("/status", protect, getStatus);
router.get("/history", protect, getHistory);
router.post("/cancel", protect, authorize("user"), cancelSubscription);

export default router; 