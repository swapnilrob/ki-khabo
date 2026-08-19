import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchRestaurantProfile } from "../api/dishes";
import StarRating from "../components/StarRating";
import DishCard from "../components/DishCard";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import { fetchRestaurantReviews } from "../api/reviews";
import { useAuth } from "../context/AuthContext";
import "../styles/menu.css";

export default function RestaurantProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ average: 0, count: 0 });
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRestaurantProfile(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || "Could not load restaurant");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
    // Fetch restaurant reviews
  useEffect(() => {
    if (!id) return;
    fetchRestaurantReviews(id)
      .then((res) => {
        setReviews(res.reviews || []);
        setReviewMeta({
          average: res.averageRating || 0,
          count: res.totalReviews || res.reviews?.length || 0,
        });
      })
      .catch(() => setReviews([]));
  }, [id]);

  const handleNewReview = (newReview) => {
    const enriched = {
      ...newReview,
      user: { name: user.name },
    };
    setReviews((prev) => [enriched, ...prev]);
    setReviewMeta((prev) => ({
      count: prev.count + 1,
      average:
        (prev.average * prev.count + newReview.rating) / (prev.count + 1),
    }));
  }; 

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error)
    return (
      <div className="profile-wrap">
        <p className="error">{error}</p>
        <Link to="/restaurants">← Back to restaurants</Link>
      </div>
    );

  const { restaurant, menuByCategory, menuCount, filtered, hiddenCount } = data;
  const categories = Object.keys(menuByCategory);

  return (
    <div className="profile-wrap">
      <Link to="/restaurants">← All restaurants</Link>

      <div className="profile-header" style={{ marginTop: 12 }}>
        <h1>{restaurant.businessName}</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <StarRating value={restaurant.averageRating} size={18} />
          <small style={{ color: "#666" }}>
            {restaurant.averageRating > 0
              ? `${restaurant.averageRating} from ${restaurant.totalReviews} reviews`
              : "No reviews yet"}
          </small>
        </div>

        <p className="profile-meta">📍 {restaurant.address}, {restaurant.city}</p>
        <p className="profile-meta">🕐 {restaurant.openingHours || "Hours not listed"}</p>
        <p className="profile-meta">📞 {restaurant.phone} · {restaurant.priceRange}</p>

        <div>
          {restaurant.cuisineTypes?.map((c) => (
            <span key={c} className="cuisine-chip">{c}</span>
          ))}
        </div>
      </div>

      {/* M1-3 — dietary filter notice */}
      {filtered && (
        <p style={{ color: "#666", fontSize: 13, margin: "12px 0" }}>
          {hiddenCount} item{hiddenCount > 1 ? "s" : ""} hidden based on your
          dietary preferences and allergies. <Link to="/app/preferences">Edit preferences</Link>
        </p>
      )}

      <h2 style={{ fontSize: 20 }}>Menu ({menuCount})</h2>

      {menuCount === 0 && (
        <p style={{ color: "#666", marginTop: 12 }}>
          This restaurant hasn't added any dishes yet.
        </p>
      )}

      {categories.map((cat) => (
        <section key={cat}>
          <h3 className="menu-section-title">{cat}</h3>
          {menuByCategory[cat].map((dish) => (
            <DishCard key={dish.id} dish={dish} restaurantId={id} />
          ))}
        </section>
      ))}

      {/* ── Restaurant Reviews ── */}
      <hr style={{ margin: "32px 0 24px", border: "none", borderTop: "1px solid #eee" }} />

      <ReviewList
        reviews={reviews}
        average={reviewMeta.average}
        count={reviewMeta.count}
        title="Restaurant Reviews"
      />

      {user ? (
        <div style={{ marginTop: 20 }}>
          <ReviewForm
            restaurantId={id}
            targetType="restaurant"
            onSubmitted={handleNewReview}
          />
        </div>
      ) : (
        <p style={{ color: "#666", marginTop: 16 }}>
          <Link to="/login">Log in</Link> to leave a review.
        </p>
      )}
    </div>
  );
} 