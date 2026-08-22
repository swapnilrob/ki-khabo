import { useState } from "react";
import StarRating from "./StarRating";
import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";
import { fetchDishReviews } from "../api/reviews";
import { logMeal } from "../api/nutrition";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../styles/nutrition.css";

const NUTRIENTS = [
  ["calories", "kcal"],
  ["protein", "protein g"],
  ["carbohydrates", "carbs g"],
  ["fat", "fat g"],
  ["sugar", "sugar g"],
  ["sodium", "sodium mg"],
  ["fiber", "fiber g"],
];

export default function DishCard({ dish, restaurantId }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ average: 0, count: 0 });
  const [loaded, setLoaded] = useState(false);

  // M2-1 — log this dish as a meal
  const [servings, setServings] = useState(1);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const n = dish.nutrition || {};

  const toggleReviews = async () => {
    if (!expanded && !loaded) {
      try {
        const res = await fetchDishReviews(dish.id);
        setReviews(res.reviews || []);
        setReviewMeta({
          average: res.rating?.average || 0,
          count: res.rating?.count || 0,
        });
      } catch {
        setReviews([]);
      }
      setLoaded(true);
    }
    setExpanded((prev) => !prev);
  };

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

  const handleLogMeal = async () => {
    setLogging(true);
    setLogged(false);
    try {
      await logMeal(dish.id, servings, restaurantId);
      setLogged(true);
    } catch {
      // swallow — button just won't show the "Logged ✓" confirmation
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="dish-card">
      <div className="dish-top">
        <span className="dish-name">{dish.name}</span>
        <span className="dish-price">৳{dish.price}</span>
      </div>

      {dish.description && <p className="dish-desc">{dish.description}</p>}

      {dish.totalReviews > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating value={dish.averageRating} size={15} />
          <small style={{ color: "#888" }}>
            {dish.averageRating} ({dish.totalReviews})
          </small>
        </div>
      )}

      <div>
        {dish.dietaryTags?.map((t) => (
          <span key={t} className="tag tag-diet">{t}</span>
        ))}
        {dish.allergens?.map((a) => (
          <span key={a} className="tag tag-allergen">contains {a}</span>
        ))}
        {dish.nutritionVerified && (
          <span className="tag tag-verified">✓ verified</span>
        )}
      </div>

      <div className="nutrition-grid">
        {NUTRIENTS.map(([key, label]) => (
          <div key={key} className="nutrition-cell">
            <span className="nutrition-val">{n[key] ?? 0}</span>
            <span className="nutrition-lbl">{label}</span>
          </div>
        ))}
      </div>

      {/* M2-1 — log this dish as a meal (food seekers only) */}
      {user?.role === "user" && (
        <div className="log-meal-row">
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="servings-input"
            aria-label="Servings"
          />
          <button className="log-meal-btn" onClick={handleLogMeal} disabled={logging}>
            {logging ? "Logging…" : "🍽️ Log this meal"}
          </button>
          {logged && <span className="logged-msg">Logged ✓</span>}
        </div>
      )}

      {/* Toggle button for dish reviews */}
      <button
        onClick={toggleReviews}
        style={{
          marginTop: 12,
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: expanded ? "#dc2626" : "#2563eb",
          color: "#fff",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.3,
        }}
      >
        {expanded ? "✕ Hide Food Reviews" : "⭐ Food Reviews & Ratings"}
      </button>  

      {/* Expanded review section */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
          <ReviewList
            reviews={reviews}
            average={reviewMeta.average}
            count={reviewMeta.count}
            title={`Reviews for ${dish.name}`}
          />

          {user ? (
            <div style={{ marginTop: 16 }}>
              <ReviewForm
                restaurantId={restaurantId}
                targetType="dish"
                dishId={dish.id}
                onSubmitted={handleNewReview}
              />
            </div>
          ) : (
            <p style={{ color: "#666", marginTop: 12, fontSize: 14 }}>
              <Link to="/login">Log in</Link> to review this dish.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 