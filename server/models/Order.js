import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["order", "reservation"],
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, default: 0, min: 0 },
    reservationDate: { type: Date, default: null },
    reservationTime: { type: String, default: "" },
    partySize: { type: Number, default: null, min: 1 },
    specialRequests: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "rescheduled", "completed", "cancelled"],
      default: "pending",
    },
    rescheduledDate: { type: Date, default: null },
    rescheduledTime: { type: String, default: "" },
    rejectionReason: { type: String, default: "", trim: true, maxlength: 500 },
    reviewEligible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);