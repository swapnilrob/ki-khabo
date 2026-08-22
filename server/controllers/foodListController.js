import asyncHandler from "express-async-handler";
import FoodList from "../models/FoodList.js";
import Dish from "../models/Dish.js";
import Restaurant from "../models/Restaurant.js";

// Shape a list for the client
const publicFoodList = (l) => ({
  id: l._id,
  owner: l.owner?._id
    ? { id: l.owner._id, name: l.owner.name }
    : l.owner, // populated vs raw ObjectId
  title: l.title,
  description: l.description,
  isPublic: l.isPublic,
  itemCount: l.items?.length || 0,
  items: (l.items || []).map((it) => ({
    id: it._id,
    itemType: it.itemType,
    dish: it.dish,
    restaurant: it.restaurant,
    note: it.note,
    addedAt: it.addedAt,
  })),
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
});

// @desc   Create a new food list
// @route  POST /api/food-lists
// @access Private (user)
export const createFoodList = asyncHandler(async (req, res) => {
  const { title, description, isPublic } = req.body;

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error("A list title is required");
  }

  const list = await FoodList.create({
    owner: req.user._id,
    title: title.trim(),
    description: description || "",
    isPublic: isPublic == null ? true : !!isPublic,
    items: [],
  });
  await list.populate("owner", "name");

  res.status(201).json({ success: true, list: publicFoodList(list) }); 
});

// @desc   Browse public lists, optionally text-searched (?search=biriyani)
// @route  GET /api/food-lists
// @access Public
export const getPublicFoodLists = asyncHandler(async (req, res) => {
  const filter = { isPublic: true };
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const lists = await FoodList.find(filter)
    .populate("owner", "name")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: lists.length,
    lists: lists.map(publicFoodList),
  });
});

// @desc   Current user's own lists (public + private)
// @route  GET /api/food-lists/mine
// @access Private (user)
export const getMyFoodLists = asyncHandler(async (req, res) => {
  const lists = await FoodList.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({
    success: true,
    count: lists.length,
    lists: lists.map(publicFoodList),
  });
});

// @desc   View a single list
// @route  GET /api/food-lists/:id
// @access Public (if isPublic) / owner-only otherwise
export const getFoodListById = asyncHandler(async (req, res) => {
  const list = await FoodList.findById(req.params.id)
    .populate("owner", "name")
    .populate("items.dish", "name price imageUrl")
    .populate("items.restaurant", "businessName city priceRange");

  if (!list) {
    res.status(404);
    throw new Error("List not found");
  }

  const isOwner = req.user && list.owner._id.toString() === req.user._id.toString();
  if (!list.isPublic && !isOwner) {
    res.status(403);
    throw new Error("This list is private");
  }

  res.json({ success: true, list: publicFoodList(list) });
});

// @desc   Edit a list's title/description/visibility
// @route  PUT /api/food-lists/:id
// @access Private (owner only)
export const updateFoodList = asyncHandler(async (req, res) => {
  const list = await FoodList.findById(req.params.id);
  if (!list) {
    res.status(404);
    throw new Error("List not found");
  }
  if (list.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit your own list");
  }

  const { title, description, isPublic } = req.body;
  if (title != null) list.title = title.trim();
  if (description != null) list.description = description;
  if (isPublic != null) list.isPublic = !!isPublic;

  await list.save();
  await list.populate("owner", "name");
  await list.populate("items.dish", "name price imageUrl");
  await list.populate("items.restaurant", "businessName city priceRange");
  res.json({ success: true, list: publicFoodList(list) }); 
});

// @desc   Delete a list
// @route  DELETE /api/food-lists/:id
// @access Private (owner only)
export const deleteFoodList = asyncHandler(async (req, res) => {
  const list = await FoodList.findById(req.params.id);
  if (!list) {
    res.status(404);
    throw new Error("List not found");
  }
  if (list.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete your own list");
  }

  await list.deleteOne();
  res.json({ success: true, message: "List deleted" });
});

// @desc   Add a dish or restaurant to a list
// @route  POST /api/food-lists/:id/items
// @access Private (owner only)
export const addItemToList = asyncHandler(async (req, res) => {
  const { itemType, dish, restaurant, note } = req.body;

  if (!["dish", "restaurant"].includes(itemType)) {
    res.status(400);
    throw new Error("itemType must be 'dish' or 'restaurant'");
  }
  if (itemType === "dish" && !dish) {
    res.status(400);
    throw new Error("A dish id is required for a dish item");
  }
  if (itemType === "restaurant" && !restaurant) {
    res.status(400);
    throw new Error("A restaurant id is required for a restaurant item");
  }

  const list = await FoodList.findById(req.params.id);
  if (!list) {
    res.status(404);
    throw new Error("List not found");
  }
  if (list.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit your own list");
  }

  // Confirm the referenced item actually exists
  if (itemType === "dish") {
    if (!(await Dish.findById(dish))) {
      res.status(404);
      throw new Error("Dish not found");
    }
  } else {
    if (!(await Restaurant.findById(restaurant))) {
      res.status(404);
      throw new Error("Restaurant not found");
    }
  }

  list.items.push({
    itemType,
    dish: itemType === "dish" ? dish : null,
    restaurant: itemType === "restaurant" ? restaurant : null,
    note: note || "",
  });
  await list.save();
  await list.populate("owner", "name");
  await list.populate("items.dish", "name price imageUrl");
  await list.populate("items.restaurant", "businessName city priceRange");

  res.status(201).json({ success: true, list: publicFoodList(list) }); 
});

// @desc   Remove an item from a list
// @route  DELETE /api/food-lists/:id/items/:itemId
// @access Private (owner only)
export const removeItemFromList = asyncHandler(async (req, res) => {
  const list = await FoodList.findById(req.params.id);
  if (!list) {
    res.status(404);
    throw new Error("List not found");
  }
  if (list.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit your own list");
  }

  const item = list.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error("Item not found in this list");
  }
  item.deleteOne();
  await list.save();
  await list.populate("owner", "name");
  await list.populate("items.dish", "name price imageUrl");
  await list.populate("items.restaurant", "businessName city priceRange");

  res.json({ success: true, list: publicFoodList(list) }); 
}); 