import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Dish from "../models/Dish.js";

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
});