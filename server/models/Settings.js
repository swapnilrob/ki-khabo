import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "platform", unique: true },

    // Shakib — M3-6
    monthlyPrice: { type: Number, default: 200 },
    yearlyPrice: { type: Number, default: 2000 },

    // Shakib — M3-7
    pointsPerTaka: { type: Number, default: 20 },

    // Noman — M3-8
    featuredRestaurants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    ],

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);