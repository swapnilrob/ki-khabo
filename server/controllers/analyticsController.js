import asyncHandler from "express-async-handler";
import Dish from "../models/Dish.js";
import Review from "../models/Review.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";

const getOwnedRestaurant = async (userId, res) => {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) {
    res.status(404);
    throw new Error("No restaurant registered for this account");
  }
  return restaurant;
};

// @desc   Menu overview stats
// @route  GET /api/analytics/menu-overview
// @access Private/Owner
export const getMenuOverview = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);
  const dishes = await Dish.find({ restaurant: restaurant._id });

  let totalPrice = 0;
  let totalCal = 0;
  let available = 0;
  let unavailable = 0;
  const categories = {};

  dishes.forEach((d) => {
    totalPrice += d.price;
    totalCal += d.nutrition?.calories || 0;
    if (d.isAvailable) available++;
    else unavailable++;
    (categories[d.category] ||= []).push(d.name);
  });

  const categoryBreakdown = Object.entries(categories).map(([cat, items]) => ({
    category: cat,
    count: items.length,
    dishes: items,
  }));

  const priceRanges = [
    { range: "Under ৳100", count: 0 },
    { range: "৳100-300", count: 0 },
    { range: "৳300-500", count: 0 },
    { range: "Over ৳500", count: 0 },
  ];
  dishes.forEach((d) => {
    if (d.price < 100) priceRanges[0].count++;
    else if (d.price <= 300) priceRanges[1].count++;
    else if (d.price <= 500) priceRanges[2].count++;
    else priceRanges[3].count++;
  });

  res.json({
    success: true,
    overview: {
      totalDishes: dishes.length,
      available,
      unavailable,
      avgPrice: dishes.length > 0 ? Math.round(totalPrice / dishes.length) : 0,
      avgCalories: dishes.length > 0 ? Math.round(totalCal / dishes.length) : 0,
      categoryBreakdown,
      priceRanges,
    },
  });
});

// @desc   Top-rated and most-reviewed dishes
// @route  GET /api/analytics/dish-rankings
// @access Private/Owner
export const getDishRankings = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);
  const dishes = await Dish.find({ restaurant: restaurant._id });

  const dishesWithRatings = await Promise.all(
    dishes.map(async (d) => {
      const rating = await Review.getDishRating(d._id);
      return {
        id: d._id,
        name: d.name,
        category: d.category,
        price: d.price,
        calories: d.nutrition?.calories || 0,
        isAvailable: d.isAvailable,
        averageRating: rating.average,
        totalReviews: rating.count,
      };
    })
  );

  const topRated = [...dishesWithRatings]
    .filter((d) => d.totalReviews > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10);

  const mostReviewed = [...dishesWithRatings]
    .filter((d) => d.totalReviews > 0)
    .sort((a, b) => b.totalReviews - a.totalReviews)
    .slice(0, 10);

  const lowestRated = [...dishesWithRatings]
    .filter((d) => d.totalReviews > 0)
    .sort((a, b) => a.averageRating - b.averageRating)
    .slice(0, 5);

  res.json({
    success: true,
    rankings: { topRated, mostReviewed, lowestRated },
  });
});

// @desc   Rating trend over time (monthly averages)
// @route  GET /api/analytics/rating-trend
// @access Private/Owner
export const getRatingTrend = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);

  const trend = await Review.aggregate([
    {
      $match: {
        restaurant: restaurant._id,
        targetType: "restaurant",
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const formatted = trend.map((t) => ({
    month: t._id.year + "-" + String(t._id.month).padStart(2, "0"),
    avgRating: Math.round(t.avgRating * 10) / 10,
    reviewCount: t.count,
  }));

  res.json({ success: true, trend: formatted });
});

// @desc   Review summary stats
// @route  GET /api/analytics/review-summary
// @access Private/Owner
export const getReviewSummary = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);

  const reviews = await Review.find({ restaurant: restaurant._id });

  const total = reviews.length;
  const withResponse = reviews.filter((r) => r.ownerResponse?.text).length;
  const withoutResponse = total - withResponse;
  const restaurantReviews = reviews.filter((r) => r.targetType === "restaurant");
  const dishReviews = reviews.filter((r) => r.targetType === "dish");

  const starDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) starDist[star]++;
  });

  const avgRating =
    total > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;

  res.json({
    success: true,
    summary: {
      totalReviews: total,
      avgRating,
      restaurantReviews: restaurantReviews.length,
      dishReviews: dishReviews.length,
      responded: withResponse,
      awaitingResponse: withoutResponse,
      starDistribution: starDist,
    },
  });
});

// @desc   Order overview — totals, revenue, status breakdown
// @route  GET /api/analytics/order-overview
// @access Private/Owner
export const getOrderOverview = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);
  const orders = await Order.find({ restaurant: restaurant._id });

  const totalOrders = orders.filter((o) => o.type === "order").length;
  const totalReservations = orders.filter((o) => o.type === "reservation").length;
  const totalRevenue = orders
    .filter((o) => o.type === "order" && (o.status === "completed" || o.status === "approved"))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const statusBreakdown = {};
  orders.forEach((o) => {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
  });

  const avgOrderValue = totalOrders > 0
    ? Math.round(orders.filter((o) => o.type === "order").reduce((s, o) => s + (o.totalAmount || 0), 0) / totalOrders)
    : 0;

  res.json({
    success: true,
    orderOverview: {
      totalOrders,
      totalReservations,
      totalRevenue,
      avgOrderValue,
      statusBreakdown,
    },
  });
});

// @desc   Best-selling dishes by order quantity
// @route  GET /api/analytics/best-sellers
// @access Private/Owner
export const getBestSellers = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);

  const result = await Order.aggregate([
    { $match: { restaurant: restaurant._id, type: "order", status: { $in: ["approved", "completed"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.dish",
        name: { $first: "$items.name" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);

  res.json({ success: true, bestSellers: result });
});

// @desc   Revenue trend over time (monthly)
// @route  GET /api/analytics/revenue-trend
// @access Private/Owner
export const getRevenueTrend = asyncHandler(async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id, res);

  const trend = await Order.aggregate([
    { $match: { restaurant: restaurant._id, type: "order", status: { $in: ["approved", "completed"] } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const formatted = trend.map((t) => ({
    month: t._id.year + "-" + String(t._id.month).padStart(2, "0"),
    revenue: t.revenue,
    orderCount: t.orderCount,
  }));

  res.json({ success: true, revenueTrend: formatted });
});