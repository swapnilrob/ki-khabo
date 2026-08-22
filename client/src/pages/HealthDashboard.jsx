import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  updateGoal,
  fetchMealLogs,
  deleteMealLog,
  fetchDailySummary,
  fetchWeeklySummary,
} from "../api/nutrition";
import "../styles/nutrition.css";

const MACRO_LABELS = [
  ["protein", "Protein", "g"],
  ["carbohydrates", "Carbs", "g"],
  ["fat", "Fat", "g"],
  ["sugar", "Sugar", "g"],
  ["fiber", "Fiber", "g"],
];

export default function HealthDashboard() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [goalInput, setGoalInput] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([fetchDailySummary(), fetchMealLogs(), fetchWeeklySummary()])
      .then(([daily, mealLogs, weekly]) => {
        setSummary(daily);
        setLogs(mealLogs.logs || []);
        setWeek(weekly);
        setGoalInput(String(daily.goal));
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load your health dashboard")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    try {
      await updateGoal(Number(goalInput));
      setEditingGoal(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your goal");
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await deleteMealLog(id);
      loadAll();
    } catch {
      // fall through — loadAll on next interaction will re-sync state
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Loading your health dashboard…</p>;

  if (error && !summary) {
    return (
      <div className="health-page">
        <p className="error">{error}</p>
        <Link to="/app">← Back to dashboard</Link>
      </div>
    );
  }

  const pct = Math.min(summary.percentOfGoal, 100);
  const chartData = week?.days.map((d) => ({
    day: d.date.slice(5), // MM-DD
    calories: Math.round(d.calories),
  }));

  return (
    <div className="health-page">
      <Link to="/app">← Back to dashboard</Link>
      <h1>Health Dashboard</h1>
      <p style={{ color: "#666" }}>
        Log meals from any restaurant's menu and track how your day adds up
        against your calorie goal.
      </p>

      {error && <p className="error">{error}</p>}

      {/* ── Daily goal + calorie ring ── */}
      <section className="health-card">
        <div className="health-card-header">
          <h2>Today</h2>
          {!editingGoal && (
            <button className="link-btn" onClick={() => setEditingGoal(true)}>
              Edit goal
            </button>
          )}
        </div>

        {editingGoal ? (
          <form onSubmit={handleSaveGoal} className="goal-form">
            <label>
              Daily calorie goal
              <input
                type="number"
                min={800}
                max={8000}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                required
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={savingGoal}>
                {savingGoal ? "Saving…" : "Save goal"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setEditingGoal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="calorie-summary">
              <div className="calorie-bar-track">
                <div
                  className="calorie-bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="calorie-numbers">
                <strong>{Math.round(summary.totals.calories)}</strong> /{" "}
                {summary.goal} kcal
                <span style={{ color: "#666" }}>
                  {" "}
                  · {summary.remaining} kcal remaining
                </span>
              </p>
            </div>

            <div className="macro-grid">
              {MACRO_LABELS.map(([key, label, unit]) => (
                <div key={key} className="macro-cell">
                  <span className="macro-val">
                    {Math.round(summary.totals[key])}
                    {unit}
                  </span>
                  <span className="macro-lbl">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Today's logged meals ── */}
      <section className="health-card">
        <h2>Today's meals ({logs.length})</h2>
        {logs.length === 0 ? (
          <p style={{ color: "#666" }}>
            Nothing logged yet — open any restaurant's menu and tap "Log this
            meal" on a dish.
          </p>
        ) : (
          <ul className="meal-log-list">
            {logs.map((log) => (
              <li key={log._id} className="meal-log-item">
                <div>
                  <strong>{log.dishName}</strong>
                  <span style={{ color: "#666" }}>
                    {" "}
                    · {log.servings}× · {Math.round(log.nutrition.calories)} kcal
                  </span>
                </div>
                <button className="link-btn" onClick={() => handleDeleteLog(log._id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Weekly progress chart ── */}
      <section className="health-card">
        <h2>This week</h2>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} kcal`, "Calories"]} />
              <ReferenceLine
                y={week?.goal}
                stroke="#d64545"
                strokeDasharray="4 4"
                label={{ value: "Goal", position: "right", fontSize: 12, fill: "#d64545" }}
              />
              <Bar dataKey="calories" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
