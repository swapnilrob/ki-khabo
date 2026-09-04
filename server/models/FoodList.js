import mongoose from "mongoose";

// One entry in a list — either a dish or a restaurant, never both.
// Kept as its own subdocument (with _id) so a single item can be
// removed from a list without touching the rest.
const listItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["dish", "restaurant"],
      required: true,
    },
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      default: null,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    // Curator's note on why this made the list, e.g. "Best kacchi in Gulshan"
    note: { type: String, trim: true, maxlength: 300, default: "" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// A curated, community-driven guide — e.g. "Best Biriyanis in Dhaka".
// Public by default so it's discoverable by all users, per M2-4.
const foodListSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "A list title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    isPublic: { type: Boolean, default: true },
    items: [listItemSchema],
  },
  { timestamps: true }
);

foodListSchema.index({ owner: 1 });
foodListSchema.index({ isPublic: 1, createdAt: -1 });
// Simple text search over title/description for the discover page.
foodListSchema.index({ title: "text", description: "text" });

export default mongoose.model("FoodList", foodListSchema); 