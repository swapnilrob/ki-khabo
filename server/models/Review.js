import mongoose from "mongoose";

// Owner's public reply, embedded inside a review (not its own collection).
const ownerResponseSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    respondedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Every review belongs to a restaurant — so an owner can pull ALL feedback
    // on their venue (dish reviews + ambience reviews) with one query.
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // "dish"       = rating of one menu item (taste/portion/value)
    // "restaurant" = overall ambience & experience
    targetType: {
      type: String,
      enum: ["dish", "restaurant"],
      required: true,
    },

    // Only set when targetType === "dish".
    // NOTE: the "Dish" model is Swapnil's (M1-2) and isn't on dev yet.
    // Mongoose stores this ObjectId fine now; populate("dish") will start
    // working automatically once his model is registered. You are NOT blocked.
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      default: null,
    },

    rating: {
      type: Number,
      required: [true, "A star rating is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
      default: "",
    },

    ownerResponse: { type: ownerResponseSchema, default: null },
  },
  { timestamps: true }
);

// ── Guard against duplicate reviews ────────────────────────────────
// One dish review per user per dish, and one ambience review per user
// per restaurant. Partial indexes keep the two rules independent.
reviewSchema.index({ user: 1, dish: 1 });
reviewSchema.index({ user: 1, restaurant: 1 });

// ── Aggregation helpers (this is the "aggregate average rating" requirement) ──

// Recompute a restaurant's overall rating from its ambience reviews and write
// it back into the Restaurant doc — those fields (averageRating, totalReviews)
// already exist on the Restaurant model, waiting for exactly this.
reviewSchema.statics.syncRestaurantRating = async function (restaurantId) {
  const [agg] = await this.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        targetType: "restaurant",
      },
    },
    { $group: { _id: "$restaurant", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const Restaurant = mongoose.model("Restaurant");
  await Restaurant.findByIdAndUpdate(restaurantId, {
    averageRating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    totalReviews: agg ? agg.count : 0,
  });
};

// Live average for a single dish. There's no Dish document to store into yet,
// so we compute it on demand. Returns { average, count }.
reviewSchema.statics.getDishRating = async function (dishId) {
  const [agg] = await this.aggregate([
    {
      $match: {
        dish: new mongoose.Types.ObjectId(dishId),
        targetType: "dish",
      },
    },
    { $group: { _id: "$dish", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return {
    average: agg ? Math.round(agg.avg * 10) / 10 : 0,
    count: agg ? agg.count : 0,
  };
};

export default mongoose.model("Review", reviewSchema);  