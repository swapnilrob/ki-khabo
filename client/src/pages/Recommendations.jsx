import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecommendations } from "../api/recommendations";
import StarRating from "../components/StarRating";
import "../styles/menu.css";
import "../styles/recommend.css";

const MEAL_TIMES = ["breakfast", "lunch", "dinner", "snacks"];

export default function Recommendations() {
  const [mealTime, setMealTime] = useState(""); // "" = let server decide by clock
  const [maxPrice, setMaxPrice] = useState("");
  const [data, setData] = useState({ context: null, recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const params = {};
      if (mealTime) params.mealTime = mealTime;
      if (maxPrice) params.maxPrice = maxPrice;

      fetchRecommendations(params)
        .then((res) => {
          setData({ context: res.context, recommendations: res.recommendations || [] });
          setError("");
        })
        .catch(() => setError("Couldn't load recommendations. Are you logged in?"))
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [mealTime, maxPrice]);

  const ctx = data.context;

  return (
    <div className="profile-wrap">
      <Link to="/app">← Dashboard</Link>
      <h1 style={{ margin: "12px 0 6px" }}>Recommended for you</h1>

      {ctx && (
        <div className="rec-context">
          <span>Picked for <strong>{ctx.mealTime}</strong></span>
          <span>
            {ctx.remainingCalories} kcal left today
            <small> (goal {ctx.dailyCalorieGoal}, eaten {ctx.consumedToday})</small>
          </span>
        </div>
      )}

      <div className="rec-controls">
        <select value={mealTime} onChange={(e) => setMealTime(e.target.value)}>
          <option value="">Auto (by time of day)</option>
          {MEAL_TIMES.map((m) => (
            <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Max price (৳)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: "#666" }}>Finding the best picks…</p>
      ) : error ? (
        <p style={{ color: "#c0392b" }}>{error}</p>
      ) : data.recommendations.length === 0 ? (
        <p>No recommendations yet. Try setting your dietary preferences, or check back after more restaurants are added.</p>
      ) : (
        data.recommendations.map((r) => (
          <div key={r._id} className="rec-card">
            <div className="rec-card-main">
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <small style={{ color: "#666" }}>
                {r.restaurant?.businessName}
                {r.restaurant?.city ? ` · ${r.restaurant.city}` : ""} · {r.category}
              </small>
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <StarRating value={r.averageRating} size={14} />
                <span className="rec-cal">{r.nutrition?.calories || 0} kcal</span>
              </div>
              {r.reasons?.length > 0 && (
                <div className="rec-reasons">
                  {r.reasons.map((reason) => (
                    <span key={reason} className="reason-chip">{reason}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="rec-card-side">
              <div className="rec-price">৳{r.price}</div>
              {r.restaurant?._id && (
                <Link to={`/restaurant/${r.restaurant._id}`}>
                  <button>View</button>
                </Link>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}