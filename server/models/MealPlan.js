import mongoose from "mongoose";

const mealEntrySchema = new mongoose.Schema(
  {
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      required: true,
    },
    mealSlot: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
  },
  { _id: false }
);

const dayPlanSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: [
        "saturday", "sunday", "monday", "tuesday",
        "wednesday", "thursday", "friday",
      ],
      required: true,
    },
    // Per-day override — 0 means "use the plan's dailyCalorieTarget"
    calorieTarget: { type: Number, default: 0, min: 0, max: 10000 },
    budgetTarget: { type: Number, default: 0, min: 0 },
    meals: [mealEntrySchema],
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [100, "Plan name cannot exceed 100 characters"],
    },
    dailyCalorieTarget: {
      type: Number,
      required: [true, "Daily calorie target is required"],
      min: [500, "Minimum 500 kcal"],
      max: [10000, "Maximum 10000 kcal"],
    },
    budgetPerDay: {
      type: Number,
      default: 0,
      min: [0, "Budget cannot be negative"],
    },
    days: [dayPlanSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mealPlanSchema.index({ user: 1, isActive: 1 });

export default mongoose.model("MealPlan", mealPlanSchema);