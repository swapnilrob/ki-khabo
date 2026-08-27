import express from "express";
import {
  placeOrder,
  reserveTable,
  getMyOrders,
  cancelOrder,
  acceptReschedule,
  getRestaurantOrders,
  approveOrder,
  rejectOrder,
  rescheduleOrder,
  completeOrder,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",         protect, authorize("user"), placeOrder);
router.post("/reserve",  protect, authorize("user"), reserveTable);
router.get("/my",        protect, authorize("user"), getMyOrders);
router.patch("/:id/cancel",            protect, authorize("user"), cancelOrder);
router.patch("/:id/accept-reschedule", protect, authorize("user"), acceptReschedule);

router.get("/restaurant",       protect, authorize("owner"), getRestaurantOrders);
router.patch("/:id/approve",    protect, authorize("owner"), approveOrder);
router.patch("/:id/reject",     protect, authorize("owner"), rejectOrder);
router.patch("/:id/reschedule", protect, authorize("owner"), rescheduleOrder);
router.patch("/:id/complete",   protect, authorize("owner"), completeOrder);

export default router;