import express from "express";
import {
  registerUser,
  registerOwner,
  login,
  getMe,
  updateMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register-owner", registerOwner);
router.post("/login", login);
router.route("/me").get(protect, getMe).put(protect, updateMe);

export default router;