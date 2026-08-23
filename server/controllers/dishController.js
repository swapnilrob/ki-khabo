import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Dish from "../models/Dish.js";
import Restaurant from "../models/Restaurant.js";
import Review from "../models/Review.js";
import { applyDietaryFilter } from "../utils/applyDietaryFilter.js";

// Guard against invalid ObjectIds — without this Mongoose throws a CastError
// that the shared error middleware turns into an ugly 500.
const assertValidId = (id, res, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error(`Invalid ${label}`);
  }
};

// Consistent shape for every dish we send to the client
const publicDish = (d) => ({
  id: d._id,
  restaurant: d.restaurant,
  name: d.name,
  description: d.description,
  price: d.price,
  category: d.category,
  imageUrl: d.imageUrl,
  dietaryTags: d.dietaryTags,
  allergens: d.allergens,
  nutrition: d.nutrition,
  nutritionVerified: d.nutritionVerified,
  isAvailable: d.isAvailable,
  averageRating: d.averageRating,
  totalReviews: d.totalReviews,
  createdAt: d.createdAt,
});

// Finds the logged-in owner's restaurant, or throws.
const getOwnedRestaurant = async (userId, res) => {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) {
    res.status(404);
    throw new Error("No restaurant registered for this account");
  }
  return restaurant;
};

// ─────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────

// @desc   Full restaurant profile + its menu (the M1-2 profile page)
// @route  GET /api/dishes/restaurant/:restaurantId
// @access Public
export const getRestaurantProfile = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  assertValidId(restaurantId, res, "restaurant id");

  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    status: "approved",
    isActive: true,
  }).select("-tradeLicenseNo -rejectionReason -reviewedBy -reviewedAt");

  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found or not yet approved");
  }

  const allDishes = await Dish.find({
    restaurant: restaurantId,
    isAvailable: true,
  }).sort({ category: 1, name: 1 });

  // M1-3 — hide anything unsafe (allergens) or off-diet for whoever's
  // logged in. req.user is only set when optionalAuth found a valid token,
  // so guests still see the full menu.
  const { visible: dishes, hiddenCount } = applyDietaryFilter(allDishes, req.user);

  // Group the menu by category so the frontend can render sections directly
  const menuByCategory = dishes.reduce((acc, d) => {
    (acc[d.category] ||= []).push(publicDish(d));
    return acc;
  }, {});

  res.json({
    success: true,
    restaurant: {
      id: restaurant._id,
      businessName: restaurant.businessName,
      address: restaurant.address,
      city: restaurant.city,
      phone: restaurant.phone,
      location: restaurant.location,
      cuisineTypes: restaurant.cuisineTypes,
      openingHours: restaurant.openingHours,
      priceRange: restaurant.priceRange,
      averageRating: restaurant.averageRating,
      totalReviews: restaurant.totalReviews,
    },
    menuCount: dishes.length,
    hiddenCount,
    filtered: hiddenCount > 0,
    menuByCategory,
    menu: dishes.map(publicDish),
  });
});

// @desc   One dish with its live review rating
// @route  GET /api/dishes/:id
// @access Public
export const getDishById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertValidId(id, res, "dish id");

  const dish = await Dish.findById(id).populate(
    "restaurant",
    "businessName city status isActive"
  );

  if (!dish) {
    res.status(404);
    throw new Error("Dish not found");
  }

  // Live rating from Shakib's Review model (M1-4)
  const rating = await Review.getDishRating(dish._id);

  res.json({
    success: true,
    dish: { ...publicDish(dish), restaurant: dish.restaurant },
    rating,
  });
});

// ─────────────────────────────────────────────────────────────
// OWNER
// ─────────────────────────────────────────────────────────────

// @desc   Owner's own full menu (including unavailable dishes)
// @route  GET /api/dishes/my/menu
// @access Private/Owner
export const getMyMenu = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);

  const dishes = await Dish.find({ restaurant: restaurant._id }).sort({
    category: 1,
    name: 1,
  });

  res.json({
    success: true,
    restaurant: { id: restaurant._id, businessName: restaurant.businessName },
    count: dishes.length,
    dishes: dishes.map(publicDish),
  });
});

// @desc   Add a dish to the owner's menu
// @route  POST /api/dishes
// @access Private/Owner
export const createDish = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);

  if (restaurant.status !== "approved") {
    res.status(403);
    throw new Error("Your restaurant must be approved before adding menu items");
  }

  const {
    name, description, price, category, imageUrl,
    dietaryTags, allergens, nutrition, isAvailable,
  } = req.body;

  if (!name || price == null) {
    res.status(400);
    throw new Error("Dish name and price are required");
  }

  const dish = await Dish.create({
    restaurant: restaurant._id,
    name,
    description: description || "",
    price,
    category: category || "main",
    imageUrl: imageUrl || "",
    dietaryTags: dietaryTags || [],
    allergens: allergens || [],
    nutrition: nutrition || {},
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  });

  res.status(201).json({ success: true, dish: publicDish(dish) });
});

// @desc   Update one of the owner's dishes
// @route  PUT /api/dishes/:id
// @access Private/Owner
export const updateDish = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertValidId(id, res, "dish id");

  const restaurant = await getOwnedRestaurant(req.user._id, res);

  const dish = await Dish.findById(id);
  if (!dish) {
    res.status(404);
    throw new Error("Dish not found");
  }

  // Ownership check — an owner may only touch their own menu
  if (dish.restaurant.toString() !== restaurant._id.toString()) {
    res.status(403);
    throw new Error("You can only edit dishes on your own menu");
  }

  const fields = [
    "name", "description", "price", "category",
    "imageUrl", "dietaryTags", "allergens", "isAvailable",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) dish[f] = req.body[f];
  });

  // Merge nutrition so a partial update doesn't wipe the other macros
  if (req.body.nutrition) {
    dish.nutrition = { ...dish.nutrition.toObject(), ...req.body.nutrition };
    dish.nutritionVerified = false; // changed data must be re-verified by admin
  }

  await dish.save();
  res.json({ success: true, dish: publicDish(dish) });
});

// @desc   Delete one of the owner's dishes
// @route  DELETE /api/dishes/:id
// @access Private/Owner
export const deleteDish = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertValidId(id, res, "dish id");

  const restaurant = await getOwnedRestaurant(req.user._id, res);

  const dish = await Dish.findById(id);
  if (!dish) {
    res.status(404);
    throw new Error("Dish not found");
  }
  if (dish.restaurant.toString() !== restaurant._id.toString()) {
    res.status(403);
    throw new Error("You can only delete dishes from your own menu");
  }

  await dish.deleteOne();
  res.json({ success: true, message: "Dish removed", id });
}); 