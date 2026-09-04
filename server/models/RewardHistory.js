import mongoose from "mongoose";

const rewardHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      enum: [
        "review_written",
        "subscription_purchased",
        "subscription_renewed",
        "meal_plan_completed",
        "points_redeemed",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

rewardHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("RewardHistory", rewardHistorySchema);  