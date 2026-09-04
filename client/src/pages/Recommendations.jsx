import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecommendations } from "../api/recommendations";
import { logMeal } from "../api/nutrition";
import StarRating from "../components/StarRating";
import AppLayout from "../components/AppLayout";
import "../styles/recommend.css";

const MEAL_TIMES = ["breakfast", "lunch", "dinner", "snacks"];

export default function Recommendations() {
  const [mealTime, setMealTime] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [data, setData] = useState({ context: null, recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggedIds, setLoggedIds] = useState(new Set());
  const [loggingId, setLoggingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const params = {};
      if (mealTime) params.mealTime = mealTime;
      if (maxPrice) params.maxPrice = maxPrice;

      fetchRecommendations(params)
        .then((res) => { setData({ context: res.context, recommendations: res.recommendations || [] }); setError(""); })
        .catch(() => setError("Couldn't load recommendations. Are you logged in?"))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [mealTime, maxPrice]);

  const handleLog = async (dish) => {
    setLoggingId(dish._id);
    try {
      await logMeal(dish._id, 1, dish.restaurant?._id);
      setLoggedIds((prev) => new Set(prev).add(dish._id));
    } catch {
      setError("Could not log meal. Try again.");
    } finally {
      setLoggingId(null);
    }
  };

  const ctx = data.context;

  return (
    <AppLayout>
      <h2 className="kk-page-title">Recommended for You</h2>
      <p className="kk-page-subtitle">Dishes picked based on your preferences, calorie goals, and time of day.</p>

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
        <p style={{ color: "var(--kk-text-muted)", marginTop: "var(--kk-space-3)" }}>Finding the best picks…</p>
      ) : error ? (
        <div style={{ background: "var(--kk-red-light)", color: "var(--kk-red)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", fontSize: 13 }}>{error}</div>
      ) : data.recommendations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--kk-space-8) var(--kk-space-5)", color: "var(--kk-text-muted)" }}>
          No recommendations yet. Try setting your dietary preferences, or check back after more restaurants are added.
        </div>
      ) : (
        data.recommendations.map((r) => {
          const isLogged = loggedIds.has(r._id);
          const isLogging = loggingId === r._id;

          return (
            <div key={r._id} className="rec-card">
              <div className="rec-card-main">
                <div>{r.name}</div>
                <small>
                  {r.restaurant?.businessName}
                  {r.restaurant?.city ? (" · " + r.restaurant.city) : ""} · {r.category}
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
                <div className="rec-price">{"৳" + r.price}</div>
                {r.restaurant?._id && (
                  <Link to={"/restaurant/" + r.restaurant._id}>
                    <button className="kk-btn kk-btn--secondary kk-btn--sm">View</button>
                  </Link>
                )}
                {isLogged ? (
                  <span className="rec-logged-badge">✅ Logged</span>
                ) : (
                  <button
                    className="kk-btn kk-btn--outline kk-btn--sm"
                    onClick={() => handleLog(r)}
                    disabled={isLogging}
                  >
                    {isLogging ? "Logging…" : "📊 Log meal"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </AppLayout>
  );
}