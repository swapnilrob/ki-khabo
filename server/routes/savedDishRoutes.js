import express from "express";
import {
  saveDish,
  unsaveDish,
  getMySavedDishes,
  getMyCollections,
} from "../controllers/savedDishController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Saved dishes and collections are always private — everything here needs auth.
router.get("/mine", protect, authorize("user"), getMySavedDishes);
router.get("/collections", protect, authorize("user"), getMyCollections);
router.post("/", protect, authorize("user"), saveDish);
router.delete("/:id", protect, authorize("user"), unsaveDish);

export default router; 