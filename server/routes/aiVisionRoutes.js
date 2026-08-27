import express from "express";
import { recognizeFood, logRecognizedMeal } from "../controllers/aiVisionController.js";
import { protect, authorize, requirePremium } from "../middleware/authMiddleware.js";

const router = express.Router();

// M3-2 (Mostahid) — Premium-only per the feature spec
router.use(protect, authorize("user"), requirePremium);

router.post("/recognize", recognizeFood);
router.post("/log", logRecognizedMeal);

export default router;
