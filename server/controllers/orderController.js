import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Dish from "../models/Dish.js";
import User from "../models/User.js";
import notify from "../utils/notify.js";
import { orderPlacedEmail, orderStatusEmail, newOrderForOwnerEmail } from "../utils/emailTemplates.js";

// @desc   Place a food order
// @route  POST /api/orders
// @access Private (user)
export const placeOrder = asyncHandler(async (req, res) => {
  const { restaurantId, items } = req.body;

  if (!restaurantId || !items?.length) {
    res.status(400);
    throw new Error("restaurantId and at least one item are required");
  }

  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    status: "approved",
    isActive: true,
  });
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found or not available");
  }

  const dishIds = items.map((i) => i.dishId);
  const dishes = await Dish.find({
    _id: { $in: dishIds },
    restaurant: restaurantId,
    isAvailable: true,
  });

  if (dishes.length !== dishIds.length) {
    res.status(400);
    throw new Error("One or more dishes are unavailable or don't belong to this restaurant");
  }

  const dishMap = Object.fromEntries(dishes.map((d) => [d._id.toString(), d]));
  const orderItems = items.map((i) => {
    const dish = dishMap[i.dishId];
    return {
      dish: dish._id,
      name: dish.name,
      price: dish.price,
      quantity: i.quantity || 1,
    };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    user: req.user._id,
    restaurant: restaurantId,
    type: "order",
    items: orderItems,
    totalAmount,
    status: "pending",
  });

  res.status(201).json({ success: true, order });

  // ── M3-5 Notifications ──
  const ownerUser = await User.findById(restaurant.owner);
  const emailUser = orderPlacedEmail(req.user.name, "order", restaurant.businessName, totalAmount);
  notify({ userId: req.user._id, userEmail: req.user.email, type: "order_placed", title: "Order placed", message: "Your order at " + restaurant.businessName + " has been placed.", link: "/app/orders", emailSubject: emailUser.subject, emailHtml: emailUser.html });
  if (ownerUser) {
    const emailOwner = newOrderForOwnerEmail(ownerUser.name, "order", req.user.name, totalAmount);
    notify({ userId: ownerUser._id, userEmail: ownerUser.email, type: "new_order_for_owner", title: "New order received", message: req.user.name + " placed an order.", link: "/owner/orders", emailSubject: emailOwner.subject, emailHtml: emailOwner.html });
  }
});

// @desc   Reserve a table
// @route  POST /api/orders/reserve
// @access Private (user)
export const reserveTable = asyncHandler(async (req, res) => {
  const { restaurantId, reservationDate, reservationTime, partySize, specialRequests } = req.body;

  if (!restaurantId || !reservationDate || !reservationTime || !partySize) {
    res.status(400);
    throw new Error("restaurantId, reservationDate, reservationTime, and partySize are required");
  }

  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    status: "approved",
    isActive: true,
  });
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found or not available");
  }

  if (new Date(reservationDate) < new Date().setHours(0, 0, 0, 0)) {
    res.status(400);
    throw new Error("Reservation date cannot be in the past");
  }

  const order = await Order.create({
    user: req.user._id,
    restaurant: restaurantId,
    type: "reservation",
    reservationDate,
    reservationTime,
    partySize,
    specialRequests: specialRequests || "",
    status: "pending",
  });

  res.status(201).json({ success: true, order });

  // ── M3-5 Notifications ──
  const resOwner = await User.findById(restaurant.owner);
  const emailRes = orderPlacedEmail(req.user.name, "reservation", restaurant.businessName);
  notify({ userId: req.user._id, userEmail: req.user.email, type: "reservation_placed", title: "Reservation placed", message: "Your reservation at " + restaurant.businessName + " has been placed.", link: "/app/orders", emailSubject: emailRes.subject, emailHtml: emailRes.html });
  if (resOwner) {
    const emailResOwner = newOrderForOwnerEmail(resOwner.name, "reservation", req.user.name);
    notify({ userId: resOwner._id, userEmail: resOwner.email, type: "new_reservation_for_owner", title: "New reservation", message: req.user.name + " made a reservation.", link: "/owner/orders", emailSubject: emailResOwner.subject, emailHtml: emailResOwner.html });
  }
});

// @desc   User's own orders/reservations
// @route  GET /api/orders/my
// @access Private (user)
export const getMyOrders = asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  const filter = { user: req.user._id };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate("restaurant", "businessName city phone")
    .populate("items.dish", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: orders.length, orders });
});

// @desc   Cancel a pending order/reservation
// @route  PATCH /api/orders/:id/cancel
// @access Private (user)
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!["pending", "rescheduled"].includes(order.status)) {
    res.status(400);
    throw new Error("Only pending or rescheduled orders can be cancelled");
  }

  order.status = "cancelled";
  await order.save();
  res.json({ success: true, message: "Order cancelled", order });
});

// @desc   Accept a rescheduled reservation
// @route  PATCH /api/orders/:id/accept-reschedule
// @access Private (user)
export const acceptReschedule = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.status !== "rescheduled") {
    res.status(400);
    throw new Error("This order has not been rescheduled");
  }

  order.reservationDate = order.rescheduledDate;
  order.reservationTime = order.rescheduledTime;
  order.rescheduledDate = null;
  order.rescheduledTime = "";
  order.status = "approved";
  await order.save();
  res.json({ success: true, message: "New time accepted", order });
});

// @desc   All orders for the owner's restaurant
// @route  GET /api/orders/restaurant
// @access Private (owner)
export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) {
    res.status(404);
    throw new Error("No restaurant registered for this account");
  }

  const { type, status } = req.query;
  const filter = { restaurant: restaurant._id };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .populate("items.dish", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: orders.length, orders });
});

// @desc   Approve an order/reservation
// @route  PATCH /api/orders/:id/approve
// @access Private (owner)
export const approveOrder = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) { res.status(404); throw new Error("No restaurant found"); }

  const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });
  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (order.status !== "pending") { res.status(400); throw new Error("Only pending orders can be approved"); }

  order.status = "approved";
  await order.save();
  res.json({ success: true, message: "Order approved", order });

  // ── M3-5 Notification ──
  const approvedUser = await User.findById(order.user);
  if (approvedUser) {
    const tplApprove = orderStatusEmail(approvedUser.name, order.type, restaurant.businessName, "approved");
    notify({ userId: approvedUser._id, userEmail: approvedUser.email, type: "order_approved", title: (order.type === "order" ? "Order" : "Reservation") + " approved", message: "Your " + order.type + " has been approved.", link: "/app/orders", emailSubject: tplApprove.subject, emailHtml: tplApprove.html });
  }
});

// @desc   Reject an order/reservation
// @route  PATCH /api/orders/:id/reject
// @access Private (owner)
export const rejectOrder = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) { res.status(404); throw new Error("No restaurant found"); }

  const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });
  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (order.status !== "pending") { res.status(400); throw new Error("Only pending orders can be rejected"); }

  order.status = "rejected";
  order.rejectionReason = req.body.reason || "";
  await order.save();
  res.json({ success: true, message: "Order rejected", order });

  // ── M3-5 Notification ──
  const rejectedUser = await User.findById(order.user);
  if (rejectedUser) {
    const tplReject = orderStatusEmail(rejectedUser.name, order.type, restaurant.businessName, "rejected", order.rejectionReason);
    notify({ userId: rejectedUser._id, userEmail: rejectedUser.email, type: "order_rejected", title: (order.type === "order" ? "Order" : "Reservation") + " rejected", message: "Your " + order.type + " has been rejected.", link: "/app/orders", emailSubject: tplReject.subject, emailHtml: tplReject.html });
  }
});

// @desc   Reschedule a reservation (owner offers new time)
// @route  PATCH /api/orders/:id/reschedule
// @access Private (owner)
export const rescheduleOrder = asyncHandler(async (req, res) => {
  const { newDate, newTime } = req.body;
  if (!newDate || !newTime) { res.status(400); throw new Error("newDate and newTime are required"); }

  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) { res.status(404); throw new Error("No restaurant found"); }

  const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });
  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (order.type !== "reservation") { res.status(400); throw new Error("Only reservations can be rescheduled"); }
  if (!["pending", "approved"].includes(order.status)) { res.status(400); throw new Error("This reservation cannot be rescheduled"); }

  order.status = "rescheduled";
  order.rescheduledDate = newDate;
  order.rescheduledTime = newTime;
  await order.save();
  res.json({ success: true, message: "Reservation rescheduled — awaiting user confirmation", order });

  // ── M3-5 Notification ──
  const reschUser = await User.findById(order.user);
  if (reschUser) {
    const tplResch = orderStatusEmail(reschUser.name, order.type, restaurant.businessName, "rescheduled");
    notify({ userId: reschUser._id, userEmail: reschUser.email, type: "order_rescheduled", title: "Reservation rescheduled", message: "The restaurant has proposed a new time.", link: "/app/orders", emailSubject: tplResch.subject, emailHtml: tplResch.html });
  }
});

// @desc   Mark an order as completed
// @route  PATCH /api/orders/:id/complete
// @access Private (owner)
export const completeOrder = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) { res.status(404); throw new Error("No restaurant found"); }

  const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });
  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (order.status !== "approved") { res.status(400); throw new Error("Only approved orders can be completed"); }

  order.status = "completed";
  order.reviewEligible = true;
  await order.save();
  res.json({ success: true, message: "Order completed — user can now leave a review", order });

  // ── M3-5 Notification ──
  const compUser = await User.findById(order.user);
  if (compUser) {
    const tplComp = orderStatusEmail(compUser.name, order.type, restaurant.businessName, "completed");
    notify({ userId: compUser._id, userEmail: compUser.email, type: "order_completed", title: "Order completed", message: "Your order has been marked as completed.", link: "/app/orders", emailSubject: tplComp.subject, emailHtml: tplComp.html });
  }
});