import asyncHandler from "express-async-handler";
import SavedDish from "../models/SavedDish.js";
import Dish from "../models/Dish.js";

// Shape a saved-dish entry for the client (dish populated with the basics)
const publicSavedDish = (s) => ({
  id: s._id,
  collectionName: s.collectionName,
  dish: s.dish?._id
    ? {
        id: s.dish._id,
        name: s.dish.name,
        price: s.dish.price,
        imageUrl: s.dish.imageUrl,
        restaurant: s.dish.restaurant,
      }
    : s.dish, // populated vs raw ObjectId
  createdAt: s.createdAt,
});

// @desc   Save a dish into a personal collection (default "Favorites")
// @route  POST /api/saved-dishes
// @access Private (user)
export const saveDish = asyncHandler(async (req, res) => {
  const { dish, collectionName } = req.body;

  if (!dish) {
    res.status(400);
    throw new Error("A dish id is required");
  }

  const existingDish = await Dish.findById(dish);
  if (!existingDish) {
    res.status(404);
    throw new Error("Dish not found");
  }

  const name = (collectionName || "Favorites").trim();

  // Friendly duplicate check (the unique index is the real guarantee)
  const dupe = await SavedDish.findOne({
    user: req.user._id,
    dish,
    collectionName: name,
  });
  if (dupe) {
    res.status(409);
    throw new Error(`This dish is already saved in "${name}"`);
  }

  const saved = await SavedDish.create({
    user: req.user._id,
    dish,
    collectionName: name,
  });
  await saved.populate("dish", "name price imageUrl restaurant");

  res.status(201).json({ success: true, saved: publicSavedDish(saved) }); 
});

// @desc   Remove a dish from a collection
// @route  DELETE /api/saved-dishes/:id
// @access Private (owner of that saved entry)
export const unsaveDish = asyncHandler(async (req, res) => {
  const saved = await SavedDish.findById(req.params.id);
  if (!saved) {
    res.status(404);
    throw new Error("Saved dish not found");
  }
  if (saved.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only remove your own saved dishes");
  }

  await saved.deleteOne();
  res.json({ success: true, message: "Removed from collection" });
});

// @desc   Current user's saved dishes (optionally filtered by collection)
// @route  GET /api/saved-dishes/mine?collection=Favorites
// @access Private (user)
export const getMySavedDishes = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.collection) filter.collectionName = req.query.collection.trim();

  const saved = await SavedDish.find(filter)
    .populate("dish", "name price imageUrl restaurant")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: saved.length,
    saved: saved.map(publicSavedDish),
  });
});

// @desc   Current user's collection names + dish counts
// @route  GET /api/saved-dishes/collections
// @access Private (user)
export const getMyCollections = asyncHandler(async (req, res) => {
  const collections = await SavedDish.getCollectionsSummary(req.user._id);
  res.json({ success: true, collections });
}); 