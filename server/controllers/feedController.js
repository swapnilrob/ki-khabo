import asyncHandler from "express-async-handler";
import Follow from "../models/Follow.js";
import Review from "../models/Review.js";
import SavedDish from "../models/SavedDish.js";
import FoodList from "../models/FoodList.js";

const SOURCE_LIMIT = 30;
const FEED_LIMIT = 30;

// @desc   Personalized feed — reviews + saved dishes + food lists from followed users
// @route  GET /api/feed
// @access Private (user)
export const getFeed = asyncHandler(async (req, res) => {
  const followingIds = await Follow.getFollowingIds(req.user._id);

  if (followingIds.length === 0) {
    return res.json({
      success: true,
      count: 0,
      feed: [],
      message: "Follow other users to see their activity here",
    });
  }

  const [reviews, savedDishes, foodLists] = await Promise.all([
    Review.find({ user: { $in: followingIds } })
      .populate("user", "name")
      .populate("restaurant", "businessName city")
      .populate("dish", "name imageUrl")
      .sort({ createdAt: -1 })
      .limit(SOURCE_LIMIT),

    SavedDish.find({ user: { $in: followingIds } })
      .populate("user", "name")
      .populate("dish", "name imageUrl price restaurant")
      .sort({ createdAt: -1 })
      .limit(SOURCE_LIMIT),

    FoodList.find({ owner: { $in: followingIds }, isPublic: true })
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .limit(SOURCE_LIMIT),
  ]);

  // Shape all three into one common envelope
  const reviewItems = reviews.map((r) => ({
    activityType: "review",
    id: r._id,
    user: { id: r.user._id, name: r.user.name },
    targetType: r.targetType,
    restaurant: r.restaurant
      ? { id: r.restaurant._id, businessName: r.restaurant.businessName, city: r.restaurant.city }
      : null,
    dish: r.dish ? { id: r.dish._id, name: r.dish.name, imageUrl: r.dish.imageUrl } : null,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));

  const savedItems = savedDishes.map((s) => ({
    activityType: "saved_dish",
    id: s._id,
    user: { id: s.user._id, name: s.user.name },
    collectionName: s.collectionName,
    dish: s.dish
      ? {
          id: s.dish._id,
          name: s.dish.name,
          imageUrl: s.dish.imageUrl,
          price: s.dish.price,
          restaurant: s.dish.restaurant,
        }
      : null,
    createdAt: s.createdAt,
  }));

  const listItems = foodLists.map((fl) => ({
    activityType: "food_list",
    id: fl._id,
    user: { id: fl.owner._id, name: fl.owner.name },
    title: fl.title,
    description: fl.description,
    itemCount: fl.items?.length || 0,
    createdAt: fl.createdAt,
  }));

  const feed = [...reviewItems, ...savedItems, ...listItems]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, FEED_LIMIT);

  res.json({ success: true, count: feed.length, feed });
}); 