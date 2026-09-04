import express from "express";
import { getFeed } from "../controllers/feedController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("user"), getFeed);

export default router;