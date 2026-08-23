import { useEffect, useState } from "react";
import { followUser, unfollowUser, getFollowStatus } from "../api/community";

/**
 * FollowButton — drop onto any user card / profile.
 *
 * Props:
 *   userId   string   the user to follow/unfollow
 */
export default function FollowButton({ userId }) {
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getFollowStatus(userId)
      .then((data) => {
        setFollowing(data.isFollowing);
        setCounts(data.counts);
      })
      .catch(() => {});
  }, [userId]);

  const toggle = async () => {
    setBusy(true);
    try {
      if (following) {
        const data = await unfollowUser(userId);
        setCounts(data.counts);
        setFollowing(false);
      } else {
        const data = await followUser(userId);
        setCounts(data.counts);
        setFollowing(true);
      }
    } catch (err) {
      console.error(err.response?.data?.message || "Follow action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={toggle}
        disabled={busy}
        style={{
          padding: "6px 16px",
          borderRadius: 20,
          border: following ? "1px solid #ccc" : "none",
          background: following ? "#fff" : "#2563eb",
          color: following ? "#333" : "#fff",
          cursor: busy ? "default" : "pointer",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {busy ? "…" : following ? "Following" : "Follow"}
      </button>
      <span style={{ fontSize: 13, color: "#888" }}>
        {counts.followers} follower{counts.followers !== 1 ? "s" : ""}
      </span>
    </span>
  );
} 