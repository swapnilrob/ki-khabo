import mongoose from "mongoose";

// Nutrition lives inside the dish — every dish has exactly one nutrition
// profile and it's always read together with the dish.
// Mostahid (M2-1 health dashboard) and my meal planner (M2-3) both read these.
const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0, min: [0, "Calories cannot be negative"] },
    protein: { type: Number, default: 0, min: [0, "Protein cannot be negative"] },
    carbohydrates: { type: Number, default: 0, min: [0, "Carbohydrates cannot be negative"] },
    fat: { type: Number, default: 0, min: [0, "Fat cannot be negative"] },
    sugar: { type: Number, default: 0, min: [0, "Sugar cannot be negative"] },
    sodium: { type: Number, default: 0, min: [0, "Sodium cannot be negative"] },
    fiber: { type: Number, default: 0, min: [0, "Fiber cannot be negative"] },
  },
  { _id: false }
);

const dishSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Dish name is required"],
      trim: true,
      maxlength: [120, "Dish name cannot exceed 120 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [600, "Description cannot exceed 600 characters"],
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    category: {
      type: String,
      enum: ["appetizer", "main", "dessert", "beverage", "side", "combo"],
      default: "main",
    },

    imageUrl: { type: String, trim: true, default: "" },

    // Powers Mostahid's dietary filter (M1-3)
    dietaryTags: [
      {
        type: String,
        enum: [
          "vegan",
          "vegetarian",
          "halal",
          "keto",
          "gluten-free",
          "dairy-free",
          "nut-free",
          "low-carb",
          "high-protein",
        ],
      },
    ],

    // Powers Mostahid's allergy filter (M1-3)
    allergens: [
      {
        type: String,
        enum: ["nuts", "dairy", "shellfish", "eggs", "soy", "gluten", "fish", "sesame"],
      },
    ],

    nutrition: { type: nutritionSchema, default: () => ({}) },

    // Admin verifies nutrition accuracy (M3-8)
    nutritionVerified: { type: Boolean, default: false },

    isAvailable: { type: Boolean, default: true },

    // Cached rating so the menu list doesn't need one aggregation per dish.
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dishSchema.index({ restaurant: 1, category: 1 });
dishSchema.index({ restaurant: 1, name: 1 }, { unique: true });

// IMPORTANT: registered as "Dish" — Shakib's Review model uses ref: "Dish".
// Renaming this breaks his populate("dish").
export default mongoose.model("Dish", dishSchema);