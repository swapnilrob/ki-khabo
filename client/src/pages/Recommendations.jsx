import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecommendations } from "../api/recommendations";
import { logMeal } from "../api/nutrition";
import StarRating from "../components/StarRating";
import "../styles/menu.css";
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
        .then((res) => {
          setData({ context: res.context, recommendations: res.recommendations || [] });
          setError("");
        })
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
        data.recommendations.map((r) => {
          const isLogged = loggedIds.has(r._id);
          const isLogging = loggingId === r._id;

          return (
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
                    <button style={{ marginBottom: 6 }}>View</button>
                  </Link>
                )}
                {isLogged ? (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "#e9f6ec",
                      color: "#1e7d34",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    ✅ Logged to Health Dashboard
                  </span>
                ) : (
                  <button
                    onClick={() => handleLog(r)}
                    disabled={isLogging}
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      background: "#2563eb",
                    }}
                  >
                    {isLogging ? "Logging…" : "📊 Log meal"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}