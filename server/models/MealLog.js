import mongoose from "mongoose";

// M2-1 — Nutritional Tracking & Health Dashboard (Mostahid)
//
// One document per "I ate this" action. Nutrition values are copied from
// the Dish at the moment of logging (scaled by servings) so a later edit
// to a dish's nutrition info — or the dish being deleted — never rewrites
// history for something the user already logged.
const mealLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },

    dishName: { type: String, required: true }, // snapshot — survives dish edits/deletion
    servings: {
      type: Number,
      default: 1,
      min: [0.25, "Servings must be at least 0.25"],
    },

    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbohydrates: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },

    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Powers both the daily and weekly summary aggregations in nutritionController
mealLogSchema.index({ user: 1, loggedAt: 1 });

export default mongoose.model("MealLog", mealLogSchema);
