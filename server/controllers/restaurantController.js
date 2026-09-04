import asyncHandler from "express-async-handler";
import Restaurant from "../models/Restaurant.js";

// @desc   Public list — approved and active only
// @route  GET /api/restaurants
export const getPublicRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find({
    status: "approved",
    isActive: true,
  }).select("-tradeLicenseNo -rejectionReason -reviewedBy");

  res.json({ success: true, count: restaurants.length, restaurants });
});

// @desc   Owner's own restaurant
// @route  GET /api/restaurants/my-restaurant
export const getMyRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) {
    res.status(404);
    throw new Error("No restaurant registered for this account");
  }
  res.json({ success: true, restaurant });
});