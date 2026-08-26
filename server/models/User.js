import mongoose from "mongoose"; 
import bcrypt from "bcryptjs";
import { DIETARY_PREFERENCES, ALLERGENS } from "../constants/dietaryOptions.js";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
    location: { type: String, default: "" },

    // M1-3 (Mostahid) — dietary preference + allergy profile
    dietaryPreferences: [{ type: String, enum: DIETARY_PREFERENCES }],
    allergies: [{ type: String, enum: ALLERGENS }],

    // M2-1 (Mostahid) — user-defined daily calorie target for the Health Dashboard
    dailyCalorieGoal: { type: Number, default: 2000, min: 800, max: 8000 },

    // Shakib (M3-6, M3-7) fills these later
    isPremium: { type: Boolean, default: false },
    premiumExpiry: { type: Date, default: null },
    subscriptionPlan: { type: String, enum: ["monthly", "yearly", null], default: null },
    rewardPoints: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);  

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);