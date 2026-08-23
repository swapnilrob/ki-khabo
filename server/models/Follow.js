import mongoose from "mongoose";

// A single directed edge: `follower` follows `following`.
// Kept as its own collection (not embedded arrays on User) so the
// feed query (M2-4) and any future "suggested users" logic can index
// and aggregate this independently of the User document.
const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// One follow edge per pair, and fast lookups in both directions.
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });

// Live counts for a profile header — computed on demand, same approach
// as Review.getDishRating(). No cached counters on User to avoid
// touching a model everyone else also writes to.
followSchema.statics.getCounts = async function (userId) {
  const [followers, following] = await Promise.all([
    this.countDocuments({ following: userId }),
    this.countDocuments({ follower: userId }),
  ]);
  return { followers, following };
};

// All the user IDs a given user follows — the building block for the feed query.
followSchema.statics.getFollowingIds = async function (userId) {
  const rows = await this.find({ follower: userId }).select("following").lean();
  return rows.map((r) => r.following);
};

export default mongoose.model("Follow", followSchema);  