import asyncHandler from "express-async-handler";
import Review from "../models/Review.js";
import Restaurant from "../models/Restaurant.js";

// Shape a review for the client (keeps responses consistent + hides nothing sensitive)
const publicReview = (r) => ({
  id: r._id,
  user: r.user?._id
    ? { id: r.user._id, name: r.user.name }
    : r.user, // populated vs raw ObjectId
  restaurant: r.restaurant,
  targetType: r.targetType,
  dish: r.dish,
  rating: r.rating,
  comment: r.comment,
  ownerResponse: r.ownerResponse,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

// @desc   Create a review (a dish rating OR an ambience/experience rating)
// @route  POST /api/reviews
// @access Private (user)
export const createReview = asyncHandler(async (req, res) => {
  const { restaurant, targetType, dish, rating, comment } = req.body;

  // 1. Basic shape validation
  if (!restaurant || !targetType || rating == null) {
    res.status(400);
    throw new Error("restaurant, targetType and rating are required");
  }
  if (!["dish", "restaurant"].includes(targetType)) {
    res.status(400);
    throw new Error("targetType must be 'dish' or 'restaurant'");
  }
  if (targetType === "dish" && !dish) {
    res.status(400);
    throw new Error("A dish id is required for a dish review");
  }

  // 2. The restaurant must exist (and only approved venues are reviewable)
  const venue = await Restaurant.findById(restaurant);
  if (!venue) {
    res.status(404);
    throw new Error("Restaurant not found");
  }
  if (venue.status !== "approved") {
    res.status(403);
    throw new Error("You can only review an approved restaurant");
  }

  // 3. Friendly duplicate check (the DB index is the real guarantee)
  // const dupeFilter =
  //   targetType === "dish"
  //     ? { user: req.user._id, dish, targetType: "dish" }
  //     : { user: req.user._id, restaurant, targetType: "restaurant" };
  // if (await Review.findOne(dupeFilter)) {
  //   res.status(409);
  //   throw new Error(
  //     targetType === "dish"
  //       ? "You've already reviewed this dish. Edit your existing review instead."
  //       : "You've already reviewed this restaurant's ambience. Edit it instead."
  //   );
  // }
  

  // 4. Create
  const review = await Review.create({
    user: req.user._id,
    restaurant,
    targetType,
    dish: targetType === "dish" ? dish : null,
    rating,
    comment: comment || "",
  });

  // 5. Keep the restaurant's stored average fresh (ambience reviews only)
  if (targetType === "restaurant") {
    await Review.syncRestaurantRating(restaurant);
  }
  // M3-7: Award points for writing a review (premium users only)
  await awardPoints(
    req.user._id,
    "review_written",
    `Reviewed ${targetType === "dish" ? "a dish" : "a restaurant"}`,
    review._id
  ); 
  res.status(201).json({ success: true, review: publicReview(review) });
});

// @desc   All reviews for one restaurant (both dish + ambience)
// @route  GET /api/reviews/restaurant/:restaurantId
// @access Public
export const getRestaurantReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ restaurant: req.params.restaurantId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: reviews.length,
    reviews: reviews.map(publicReview),
  });
});

// @desc   All reviews for one dish + its live aggregate
// @route  GET /api/reviews/dish/:dishId
// @access Public
export const getDishReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    dish: req.params.dishId,
    targetType: "dish",
  })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  const rating = await Review.getDishRating(req.params.dishId);

  res.json({
    success: true,
    rating, // { average, count }
    count: reviews.length,
    reviews: reviews.map(publicReview),
  });
});

// @desc   Current user's own reviews
// @route  GET /api/reviews/mine
// @access Private (user)
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({
    success: true,
    count: reviews.length,
    reviews: reviews.map(publicReview),
  });
});

// @desc   Edit your own review
// @route  PUT /api/reviews/:id
// @access Private (author only)
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // Ownership check — only the author can edit
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit your own review");
  }

  const { rating, comment } = req.body;
  if (rating != null) review.rating = rating;
  if (comment != null) review.comment = comment;

  await review.save(); // runs schema validators (1–5, length)

  if (review.targetType === "restaurant") {
    await Review.syncRestaurantRating(review.restaurant);
  }

  res.json({ success: true, review: publicReview(review) });
});

// @desc   Delete your own review
// @route  DELETE /api/reviews/:id
// @access Private (author only)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete your own review");
  }

  const { restaurant, targetType } = review;
  await review.deleteOne();

  if (targetType === "restaurant") {
    await Review.syncRestaurantRating(restaurant);
  }

  res.json({ success: true, message: "Review deleted" });
});

// @desc   Owner publicly responds to a review on their restaurant
// @route  PUT /api/reviews/:id/response
// @access Private (owner of that restaurant)
export const respondToReview = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Response text is required");
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // The logged-in owner must own the restaurant this review is about
  const venue = await Restaurant.findById(review.restaurant);
  if (!venue || venue.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only respond to reviews on your own restaurant");
  }

  review.ownerResponse = {
    text: text.trim(),
    respondedBy: req.user._id,
    respondedAt: new Date(),
  };
  await review.save();

  res.json({ success: true, review: publicReview(review) });
}); 