import mongoose from "mongoose";

// A dish a user has bookmarked into one of their personal (private)
// collections. Default collection is "Favorites" so saving needs no
// extra input, but a user can organize into named collections too
// (e.g. "Weekend Cravings"). Not to be confused with FoodList (M2-4),
// which is public/curated — this is always private to the saver.
const savedDishSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      required: true,
    },
    collectionName: {
      type: String,
      trim: true,
      default: "Favorites",
      maxlength: [60, "Collection name cannot exceed 60 characters"],
    },
  },
  { timestamps: true }
);

// Same dish can't be saved twice into the same collection by the same user.
savedDishSchema.index({ user: 1, dish: 1, collectionName: 1 }, { unique: true });
savedDishSchema.index({ user: 1, collectionName: 1 });

// Distinct collection names for a user, with how many dishes are in each —
// powers a "My Collections" screen without a second query per collection.
savedDishSchema.statics.getCollectionsSummary = async function (userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$collectionName", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, collectionName: "$_id", count: 1 } },
  ]);
};

export default mongoose.model("SavedDish", savedDishSchema); 