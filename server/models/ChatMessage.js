import mongoose from "mongoose";

// M3-1 — AI Nutrition & Diet Assistant (Mostahid)
//
// Persists the assistant's conversation per user so "24/7 access" actually
// means something — chat history survives across sessions/devices, not
// just kept in React state.
const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },

    // Dishes the assistant referenced in this reply (only set on
    // role: "assistant" messages) — lets the UI re-render the same
    // suggestion cards if chat history is reloaded later.
    suggestedDishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }],
  },
  { timestamps: true }
);

chatMessageSchema.index({ user: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
