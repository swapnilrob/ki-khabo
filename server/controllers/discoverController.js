import asyncHandler from "express-async-handler";
import Restaurant from "../models/Restaurant.js";

// Escape user input before using it inside a RegExp, so a search like
// "Cafe (24)" can't break the query or become a slow catastrophic regex.
const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Turn "italian,thai" (or ["italian","thai"]) into a clean array.
const toArray = (val) =>
  (Array.isArray(val) ? val : String(val || "").split(","))
    .map((s) => s.trim())
    .filter(Boolean);

// Fields the public should never see, even on an approved restaurant.
const PROJECT_PUBLIC = {
  tradeLicenseNo: 0,
  rejectionReason: 0,
  reviewedBy: 0,
  reviewedAt: 0,
};

// @desc   Search + filter approved restaurants (M1-1)
// @route  GET /api/discover/restaurants
// @access Public
//
// Query params (all optional):
//   q          text search on businessName
//   city       partial, case-insensitive city match
//   cuisine    comma list -> matches ANY (e.g. cuisine=thai,italian)
//   priceRange comma list -> $ , $$ , $$$
//   minRating  0-5, keeps restaurants with averageRating >= this
//   lat,lng    user's location -> enables distance + "near me"
//   radius     metres (default 5000) — only used with lat,lng
//   sort       "rating" | "name" | "distance"  (distance needs lat,lng)
//   page,limit pagination (defaults 1, 12; limit capped at 50)
export const searchRestaurants = asyncHandler(async (req, res) => {
  const { q, city, cuisine, priceRange, minRating, lat, lng, radius, sort } =
    req.query;

  // ── Build the base filter every branch shares ───────────────────
  const match = { status: "approved", isActive: true };

  if (q) match.businessName = { $regex: escapeRegex(q), $options: "i" };
  if (city) match.city = { $regex: escapeRegex(city), $options: "i" };

  const cuisines = toArray(cuisine);
  if (cuisines.length) match.cuisineTypes = { $in: cuisines };

  const prices = toArray(priceRange).filter((p) => ["$", "$$", "$$$"].includes(p));
  if (prices.length) match.priceRange = { $in: prices };

  const min = parseFloat(minRating);
  if (!Number.isNaN(min)) match.averageRating = { $gte: min };

  // ── Pagination ──────────────────────────────────────────────────
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  // ── Geo? (only if BOTH lat and lng are valid numbers) ───────────
  const latN = parseFloat(lat);
  const lngN = parseFloat(lng);
  const hasGeo = !Number.isNaN(latN) && !Number.isNaN(lngN);

  const pipeline = [];

  if (hasGeo) {
    // $geoNear MUST be the first stage; it also applies `match` for us
    // and returns nearest-first with a computed `distance` field (metres).
    pipeline.push({
      $geoNear: {
        near: { type: "Point", coordinates: [lngN, latN] },
        distanceField: "distance",
        spherical: true,
        maxDistance: parseFloat(radius) || 5000,
        query: match,
      },
    });
  } else {
    pipeline.push({ $match: match });
  }

  // ── Sorting ─────────────────────────────────────────────────────
  // With geo, results are already distance-sorted; only re-sort if the
  // caller explicitly wants rating/name instead.
  if (sort === "rating") pipeline.push({ $sort: { averageRating: -1, totalReviews: -1 } });
  else if (sort === "name") pipeline.push({ $sort: { businessName: 1 } });
  else if (!hasGeo) pipeline.push({ $sort: { averageRating: -1, totalReviews: -1 } });
  // (geo + no explicit sort  ->  keep $geoNear's distance order)

  // ── One round-trip for both the page and the total count ────────
  pipeline.push({
    $facet: {
      meta: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: limit }, { $project: PROJECT_PUBLIC }],
    },
  });

  const [result] = await Restaurant.aggregate(pipeline);
  const total = result?.meta?.[0]?.total || 0;
  const restaurants = result?.data || [];

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    count: restaurants.length,
    restaurants,
  });
});

// @desc   Distinct values to populate the filter UI (cuisine + price chips)
// @route  GET /api/discover/filters
// @access Public
export const getFilterOptions = asyncHandler(async (req, res) => {
  const base = { status: "approved", isActive: true };
  const [cuisines, cities] = await Promise.all([
    Restaurant.distinct("cuisineTypes", base),
    Restaurant.distinct("city", base),
  ]);

  res.json({
    success: true,
    cuisines: cuisines.filter(Boolean).sort(),
    cities: cities.filter(Boolean).sort(),
    priceRanges: ["$", "$$", "$$$"],
  });
});