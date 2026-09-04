import express from "express";
import {
  getRestaurantProfile,
  getDishById,
  getMyMenu,
  createDish,
  updateDish,
  deleteDish,
} from "../controllers/dishController.js";
import { protect, authorize, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public reads ──
// Specific paths first, then the /:id wildcard last.
// optionalAuth (M1-3): identifies a logged-in user, if any, so the dietary
// filter can personalize the menu — guests still get the full list.
router.get("/restaurant/:restaurantId", optionalAuth, getRestaurantProfile);

// ── Owner menu management ──
router.get("/my/menu", protect, authorize("owner"), getMyMenu);
router.post("/", protect, authorize("owner"), createDish);
router.put("/:id", protect, authorize("owner"), updateDish);
router.delete("/:id", protect, authorize("owner"), deleteDish);

// ── Public single dish (LAST — /:id would otherwise swallow the paths above) ──
router.get("/:id", getDishById);

export default router; 