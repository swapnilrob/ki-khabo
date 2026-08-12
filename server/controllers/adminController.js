import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Settings from "../models/Settings.js";

// @desc   Platform overview stats
// @route  GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [users, owners, pending, approved, rejected, premium] =
    await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "owner" }),
      Restaurant.countDocuments({ status: "pending" }),
      Restaurant.countDocuments({ status: "approved" }),
      Restaurant.countDocuments({ status: "rejected" }),
      User.countDocuments({ isPremium: true }),
    ]);

  res.json({
    success: true,
    stats: {
      totalUsers: users,
      totalOwners: owners,
      premiumSubscribers: premium,
      pendingRestaurants: pending,
      approvedRestaurants: approved,
      rejectedRestaurants: rejected,
    },
  });
});

// @desc   List restaurants filtered by status
// @route  GET /api/admin/restaurants?status=pending
export const getRestaurants = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const restaurants = await Restaurant.find(filter)
    .populate("owner", "name email phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: restaurants.length, restaurants });
});

// @desc   Approve or reject a restaurant
// @route  PATCH /api/admin/restaurants/:id/status
export const updateRestaurantStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Status must be either 'approved' or 'rejected'");
  }

  const restaurant = await Restaurant.findById(req.params.id).populate(
    "owner",
    "name email"
  );
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }

  restaurant.status = status;
  restaurant.rejectionReason =
    status === "rejected" ? rejectionReason || "Not specified" : "";
  restaurant.reviewedBy = req.user._id;
  restaurant.reviewedAt = new Date();
  await restaurant.save();

  // TODO (Swapnil, M3-5): email the owner about approval/rejection

  res.json({
    success: true,
    message: `Restaurant ${status} successfully`,
    restaurant,
  });
});

// @desc   Deactivate / reactivate a restaurant
// @route  PATCH /api/admin/restaurants/:id/toggle-active
export const toggleRestaurantActive = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }

  restaurant.isActive = !restaurant.isActive;
  await restaurant.save();

  res.json({
    success: true,
    message: restaurant.isActive
      ? "Restaurant reactivated"
      : "Restaurant deactivated",
    isActive: restaurant.isActive,
  });
});

// @desc   List all users
// @route  GET /api/admin/users?role=user
export const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// @desc   Deactivate / reactivate a user
// @route  PATCH /api/admin/users/:id/toggle-active
export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Admin accounts cannot be deactivated");
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: user.isActive ? "Account reactivated" : "Account deactivated",
    isActive: user.isActive,
  });
});

// @desc   Get platform settings
// @route  GET /api/admin/settings
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) settings = await Settings.create({ key: "platform" });
  res.json({ success: true, settings });
});

// @desc   Update platform settings
// @route  PUT /api/admin/settings
export const updateSettings = asyncHandler(async (req, res) => {
  const { monthlyPrice, yearlyPrice, pointsPerTaka, featuredRestaurants } =
    req.body;

  const updates = { updatedBy: req.user._id };
  if (monthlyPrice != null) updates.monthlyPrice = monthlyPrice;
  if (yearlyPrice != null) updates.yearlyPrice = yearlyPrice;
  if (pointsPerTaka != null) updates.pointsPerTaka = pointsPerTaka;
  if (featuredRestaurants) updates.featuredRestaurants = featuredRestaurants;

  const settings = await Settings.findOneAndUpdate(
    { key: "platform" },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ success: true, message: "Settings updated", settings });
});