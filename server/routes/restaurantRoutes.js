import express from "express";
import {
  getPublicRestaurants,
  getMyRestaurant,
} from "../controllers/restaurantController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublicRestaurants);
router.get("/my-restaurant", protect, authorize("owner"), getMyRestaurant);

export default router;