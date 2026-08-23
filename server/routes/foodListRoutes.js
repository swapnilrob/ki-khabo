import express from "express";
import {
  createFoodList,
  getPublicFoodLists,
  getMyFoodLists,
  getFoodListById,
  updateFoodList,
  deleteFoodList,
  addItemToList,
  removeItemFromList,
} from "../controllers/foodListController.js";
import { protect, authorize, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public browse (discover page — anyone can browse curated lists) ──
router.get("/", getPublicFoodLists);

// ── Logged-in user's own lists ──
router.get("/mine", protect, authorize("user"), getMyFoodLists);
router.post("/", protect, authorize("user"), createFoodList);

// ── Single list (optionalAuth so a private list's owner can still view it) ──
router.get("/:id", optionalAuth, getFoodListById);
router.put("/:id", protect, authorize("user"), updateFoodList);
router.delete("/:id", protect, authorize("user"), deleteFoodList);

// ── List items ──
router.post("/:id/items", protect, authorize("user"), addItemToList);
router.delete("/:id/items/:itemId", protect, authorize("user"), removeItemFromList);

export default router; 