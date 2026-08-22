import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from "../controllers/followController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public reads (profile pages are browsable before signing up) ──
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

// ── Logged-in user actions ──
router.get("/:userId/status", protect, authorize("user"), getFollowStatus);
router.post("/:userId", protect, authorize("user"), followUser);
router.delete("/:userId", protect, authorize("user"), unfollowUser);

export default router; 