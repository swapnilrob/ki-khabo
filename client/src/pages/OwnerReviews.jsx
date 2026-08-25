import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui";
import StarRating from "../components/StarRating";
import { fetchRestaurantReviews, respondToReview } from "../api/reviews";
import api from "../api/axios";

export default function OwnerReviews() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Get the owner's own restaurant
      const { data: restData } = await api.get("/restaurants/my-restaurant");
      setRestaurant(restData.restaurant);

      // Fetch reviews for that restaurant
      const reviewData = await fetchRestaurantReviews(restData.restaurant._id);
      setReviews(reviewData.reviews);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await respondToReview(reviewId, replyText.trim());
      setReplyingTo(null);
      setReplyText("");
      setMsg("Response posted.");
      setTimeout(() => setMsg(""), 3000);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to post response.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <p style={{ padding: 24, color: "var(--kk-text-muted)" }}>Loading reviews...</p>
      </AppLayout>
    );
  }

  if (!restaurant) {
    return (
      <AppLayout>
        <p style={{ padding: 24, color: "var(--kk-text-muted)" }}>No restaurant found for your account.</p>
      </AppLayout>
    );
  }

  // Separate restaurant-level and dish-level reviews
  const ambienceReviews = reviews.filter((r) => r.targetType === "restaurant");
  const dishReviews = reviews.filter((r) => r.targetType === "dish");

  const ambienceAvg =
    ambienceReviews.length > 0
      ? ambienceReviews.reduce((sum, r) => sum + r.rating, 0) / ambienceReviews.length
      : null;

  return (
    <AppLayout>
      <h2 className="kk-page-title">Customer Reviews</h2>
      <p className="kk-page-subtitle">
        {restaurant.businessName} — {reviews.length} total review{reviews.length !== 1 ? "s" : ""}
      </p>

      {msg && (
        <div style={{
          background: "var(--kk-green-light)",
          color: "var(--kk-green)",
          fontSize: 13,
          fontWeight: 500,
          padding: "10px 16px",
          borderRadius: "var(--kk-radius-sm)",
          marginBottom: 20,
        }}>
          {msg}
        </div>
      )}

      {reviews.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px 24px", color: "var(--kk-text-muted)" }}>
          No reviews yet. Reviews will appear here once customers rate your restaurant or dishes.
        </Card>
      ) : (
        <>
          {/* Ambience / Experience Reviews */}
          {ambienceReviews.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Ambience &amp; Experience</h3>
                {ambienceAvg != null && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <StarRating value={ambienceAvg} size={16} />
                    <strong style={{ fontSize: 14 }}>{ambienceAvg.toFixed(1)}</strong>
                    <span style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>({ambienceReviews.length})</span>
                  </span>
                )}
              </div>
              {ambienceReviews.map((r) => renderReview(r))}
            </div>
          )}

          {/* Dish Reviews */}
          {dishReviews.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Dish Reviews</h3>
              {dishReviews.map((r) => renderReview(r))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );

  function renderReview(r) {
    return (
      <Card key={r.id} style={{ marginBottom: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <StarRating value={r.rating} size={16} />
          <strong style={{ fontSize: 14 }}>{r.user?.name || "Anonymous"}</strong>
          <span style={{ color: "var(--kk-text-muted)", fontSize: 12 }}>
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
          {r.targetType === "dish" && (
            <span style={{
              background: "var(--kk-orange-light)",
              color: "var(--kk-orange)",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 4,
            }}>
              DISH
            </span>
          )}
        </div>

        {r.comment && (
          <p style={{ margin: "4px 0 12px", color: "var(--kk-text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
            {r.comment}
          </p>
        )}

        {/* Existing owner response */}
        {r.ownerResponse && (
          <div style={{
            marginTop: 8,
            marginLeft: 16,
            padding: "10px 14px",
            background: "var(--kk-blue-light)",
            borderLeft: "3px solid var(--kk-blue)",
            borderRadius: "var(--kk-radius-sm)",
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--kk-blue)" }}>
              Your response
            </span>
            <p style={{ margin: "4px 0 0", color: "var(--kk-text-secondary)", fontSize: 13 }}>
              {r.ownerResponse.text}
            </p>
          </div>
        )}

        {/* Reply button + form */}
        {!r.ownerResponse && (
          <>
            {replyingTo === r.id ? (
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your response..."
                  rows={2}
                  style={{
                    flex: 1,
                    padding: 8,
                    border: "1px solid var(--kk-border)",
                    borderRadius: "var(--kk-radius-sm)",
                    fontFamily: "inherit",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button
                    className="kk-btn kk-btn--primary kk-btn--sm"
                    onClick={() => handleReply(r.id)}
                    disabled={submitting || !replyText.trim()}
                  >
                    {submitting ? "Posting..." : "Post"}
                  </button>
                  <button
                    className="kk-btn kk-btn--ghost kk-btn--sm"
                    onClick={() => { setReplyingTo(null); setReplyText(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="kk-btn kk-btn--outline kk-btn--sm"
                style={{ marginTop: 8 }}
                onClick={() => { setReplyingTo(r.id); setReplyText(""); }}
              >
                Respond
              </button>
            )}
          </>
        )}
      </Card>
    );
  }
}