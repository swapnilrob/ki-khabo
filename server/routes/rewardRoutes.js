import express from "express";
import { getRewards, redeemPoints } from "../controllers/rewardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getRewards);
router.post("/redeem", protect, redeemPoints);

export default router; 