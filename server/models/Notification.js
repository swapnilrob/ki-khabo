import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "order_placed", "order_approved", "order_rejected",
        "order_rescheduled", "order_completed", "order_cancelled",
        "reservation_placed", "reservation_approved", "reservation_rejected",
        "reservation_rescheduled",
        "new_order_for_owner", "new_reservation_for_owner",
        "application_received", "application_approved", "application_rejected",
        "subscription_activated", "subscription_cancelled",
        "meal_planner_reminder",
        "general",
      ],
      default: "general",
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);