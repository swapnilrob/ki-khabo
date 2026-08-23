import { useEffect, useState } from "react";
import { getFeed } from "../api/community";
import StarRating from "../components/StarRating";

export default function Feed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    getFeed()
      .then((data) => {
        setFeed(data.feed);
        setMessage(data.message || "");
      })
      .catch(() => setMessage("Could not load feed."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading your feed…</p>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h2>Your Feed</h2>

      {message && feed.length === 0 && (
        <p style={{ color: "#888" }}>{message}</p>
      )}

      {feed.map((item) => (
        <div
          key={`${item.activityType}-${item.id}`}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 10,
            padding: 16,
            marginBottom: 12,
          }}
        >
          {/* ── Header: who did what ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#e0e7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#2563eb",
                fontSize: 14,
              }}
            >
              {item.user?.name?.charAt(0) || "?"}
            </div>
            <div>
              <strong>{item.user?.name || "Someone"}</strong>
              <span style={{ color: "#888", fontSize: 13, marginLeft: 6 }}>
                {item.activityType === "review" && "wrote a review"}
                {item.activityType === "saved_dish" && "saved a dish"}
                {item.activityType === "food_list" && "created a list"}
              </span>
            </div>
            <span style={{ marginLeft: "auto", color: "#aaa", fontSize: 12 }}>
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* ── Review card ── */}
          {item.activityType === "review" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <StarRating value={item.rating} size={16} />
                <span style={{ fontSize: 13, color: "#666" }}>
                  {item.targetType === "dish" ? item.dish?.name : item.restaurant?.businessName}
                </span>
              </div>
              {item.comment && <p style={{ margin: "4px 0 0", color: "#333" }}>{item.comment}</p>}
              {item.restaurant && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
                  at {item.restaurant.businessName}, {item.restaurant.city}
                </p>
              )}
            </div>
          )}

          {/* ── Saved dish card ── */}
          {item.activityType === "saved_dish" && (
            <div>
              <p style={{ margin: 0 }}>
                Saved <strong>{item.dish?.name || "a dish"}</strong>
                {item.dish?.price != null && (
                  <span style={{ color: "#888", fontSize: 13 }}> — ৳{item.dish.price}</span>
                )}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>
                to collection: {item.collectionName || "Favorites"}
              </p>
            </div>
          )}

          {/* ── Food list card ── */}
          {item.activityType === "food_list" && (
            <div>
              <p style={{ margin: 0 }}>
                Created <strong>"{item.title}"</strong>
                <span style={{ color: "#888", fontSize: 13 }}>
                  {" "}— {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
                </span>
              </p>
              {item.description && (
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#555" }}>{item.description}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}  