import { useEffect, useState, useCallback } from "react";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import { fetchRestaurantReviews } from "../api/reviews";
import { useAuth } from "../context/AuthContext";

// Hardcoded for the demo — your approved test restaurant.
// (In the real app this id comes from the restaurant profile page — Swapnil's M1-2.)
const RESTAURANT_ID = "6a7f7be4f2bc8f397a5ab2d9";

export default function ReviewDemo() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRestaurantReviews(RESTAURANT_ID);
      setReviews(data.reviews);

      // Compute the ambience average from the restaurant-type reviews
      const ambience = data.reviews.filter((r) => r.targetType === "restaurant");
      const avg =
        ambience.length > 0
          ? ambience.reduce((sum, r) => sum + r.rating, 0) / ambience.length
          : null;
      setAverage(avg);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // When the form posts a new review, refetch so the list + average update
  const handleSubmitted = () => load();

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h2>Ki Khabo — Reviews </h2>
      <p style={{ color: "#666" }}>
        Restaurant: <code>{RESTAURANT_ID}</code>
      </p>

      {user ? (
        <div style={{ margin: "16px 0" }}>
          <ReviewForm
            restaurantId={RESTAURANT_ID}
            targetType="restaurant"
            onSubmitted={handleSubmitted}
          />
        </div>
      ) : (
        <p style={{ color: "#c0392b" }}>
          Log in as a regular user to write a review.
        </p>
      )}

      <hr style={{ margin: "20px 0" }} />

      {loading ? (
        <p>Loading reviews…</p>
      ) : (
        <ReviewList
          reviews={reviews}
          average={average}
          title="Ambience & experience"
        />
      )}
    </div>
  );
}   