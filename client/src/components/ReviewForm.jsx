import { useState } from "react";
import StarRating from "./StarRating";
import { createReview } from "../api/reviews";

/**
 * ReviewForm — submit a dish OR restaurant review.
 *
 * Props:
 *   restaurantId  string   required — the venue being reviewed
 *   targetType    string   "dish" | "restaurant"  (default "restaurant")
 *   dishId        string   required when targetType === "dish"
 *   onSubmitted   fn       called with the new review after a successful post
 */
export default function ReviewForm({
  restaurantId,
  targetType = "restaurant",
  dishId = null,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");

    // Client-side guard: a rating is mandatory (mirrors the server rule)
    if (rating < 1) {
      setError("Please select a star rating first.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        restaurant: restaurantId,
        targetType,
        rating,
        comment: comment.trim(),
      };
      if (targetType === "dish") payload.dish = dishId;

      const data = await createReview(payload);

      // Reset the form and hand the new review up to the parent
      setRating(0);
      setComment("");
      onSubmitted?.(data.review);
    } catch (err) {
      // Show the server's real message (e.g. "already reviewed this dish")
      setError(err.response?.data?.message || "Could not submit your review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 10,
        padding: 16,
        maxWidth: 480,
      }}
    >
      <h4 style={{ margin: "0 0 10px" }}>
        {targetType === "dish" ? "Rate this dish" : "Rate your experience"}
      </h4>

      <div style={{ marginBottom: 10 }}>
        <StarRating value={rating} onChange={setRating} editable size={28} />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={
          targetType === "dish"
            ? "How was the taste, portion, and value?"
            : "Tell others about the ambience and overall experience…"
        }
        rows={3}
        maxLength={1000}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />

      {error && (
        <p style={{ color: "#c0392b", margin: "8px 0 0", fontSize: 14 }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 10,
          padding: "8px 18px",
          borderRadius: 6,
          border: "none",
          background: submitting ? "#9bbcf0" : "#2563eb",
          color: "#fff",
          cursor: submitting ? "default" : "pointer",
          fontWeight: 600,
        }}
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
} 