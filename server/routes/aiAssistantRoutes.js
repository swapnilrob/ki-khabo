import express from "express";
import {
  getHealthProfile,
  updateHealthProfile,
  applyTargetGoal,
  chat,
  getChatHistory,
  clearChatHistory,
} from "../controllers/aiAssistantController.js";
import { protect, authorize, requirePremium } from "../middleware/authMiddleware.js";

const router = express.Router();

// M3-1 (Mostahid) — Premium-only per the feature spec
router.use(protect, authorize("user"), requirePremium);

router.get("/health-profile", getHealthProfile);
router.put("/health-profile", updateHealthProfile);
router.post("/apply-target-goal", applyTargetGoal);

router.get("/chat", getChatHistory);
router.post("/chat", chat);
router.delete("/chat", clearChatHistory);

export default router;
