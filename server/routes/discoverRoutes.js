import express from "express";
import {
  searchRestaurants,
  getFilterOptions,
} from "../controllers/discoverController.js";

const router = express.Router();

// Both are public — discovery should work before a user signs up.
router.get("/restaurants", searchRestaurants);
router.get("/filters", getFilterOptions);

export default router;