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
import AppLayout from "../components/AppLayout";
import { Card, Calendar } from "../components/ui";
import {
  updateGoal,
  fetchMealLogs,
  deleteMealLog,
  fetchDailySummary,
  fetchWeeklySummary,
  fetchMonthSummary,
} from "../api/nutrition";

const MACRO_LABELS = [
  ["protein", "Protein", "g"],
  ["carbohydrates", "Carbs", "g"],
  ["fat", "Fat", "g"],
  ["sugar", "Sugar", "g"],
  ["fiber", "Fiber", "g"],
];

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthOf = (dateStr) => dateStr.slice(0, 7);

const formatDateLabel = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};

export default function HealthDashboard() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [week, setWeek] = useState(null);
  const [monthMarks, setMonthMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [goalInput, setGoalInput] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  const isToday = selectedDate === todayStr();

  // ── Load the selected day's summary, meals, and its trailing 7-day chart ──
  const loadDay = useCallback((date) => {
    setLoading(true);
    setError("");
    Promise.all([fetchDailySummary(date), fetchMealLogs(date), fetchWeeklySummary(date)])
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

  // ── Load which dates in a given month have logs, for the calendar dots ──
  const loadMonth = useCallback((month) => {
    fetchMonthSummary(month)
      .then((res) => {
        const marks = {};
        (res.days || []).forEach((d) => { marks[d.date] = d; });
        setMonthMarks(marks);
      })
      .catch(() => {
        // non-critical — calendar just shows no dots if this fails
      });
  }, []);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  useEffect(() => {
    loadMonth(monthOf(selectedDate));
  }, [loadMonth]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-run on explicit month navigation, not every date click

  const handleSelectDate = (date) => setSelectedDate(date);
  const handleMonthChange = (month) => loadMonth(month);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    try {
      await updateGoal(Number(goalInput));
      setEditingGoal(false);
      loadDay(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your goal");
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await deleteMealLog(id);
      loadDay(selectedDate);
      loadMonth(monthOf(selectedDate));
    } catch {
      setError("Could not remove that log. Try again.");
    }
  };

  const sidebar = (
    <Calendar
      selectedDate={selectedDate}
      onSelectDate={handleSelectDate}
      markedDates={monthMarks}
      onMonthChange={handleMonthChange}
    />
  );

  if (loading && !summary) {
    return (
      <AppLayout sidebar={sidebar}>
        <p style={{ color: "var(--kk-text-muted)" }}>Loading your health dashboard…</p>
      </AppLayout>
    );
  }

  if (error && !summary) {
    return (
      <AppLayout sidebar={sidebar}>
        <div className="kk-error">{error}</div>
        <Link to="/app">← Back to dashboard</Link>
      </AppLayout>
    );
  }

  const pct = summary ? Math.min(summary.percentOfGoal, 100) : 0;
  const chartData = week?.days.map((d) => ({
    day: d.date.slice(5),
    calories: Math.round(d.calories),
  }));

  return (
    <AppLayout sidebar={sidebar}>
      <h2 className="kk-page-title">Health Dashboard</h2>
      <p className="kk-page-subtitle">
        Log meals from any restaurant's menu and track how your day adds up against your calorie goal.
        Pick a date on the calendar to browse your history.
      </p>

      {error && <div className="kk-error">{error}</div>}

      {/* ── Selected day header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--kk-space-4)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
          {isToday ? "Today" : formatDateLabel(selectedDate)}
        </h3>
        {!isToday && (
          <button className="kk-btn kk-btn--outline kk-btn--sm" onClick={() => setSelectedDate(todayStr())}>
            Back to today
          </button>
        )}
      </div>

      {/* ── Calorie + macro summary ── */}
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Calories</h3>
          {isToday && !editingGoal && (
            <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setEditingGoal(true)}>
              Edit goal
            </button>
          )}
        </div>

        {editingGoal ? (
          <form onSubmit={handleSaveGoal} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="kk-input-group" style={{ maxWidth: 200 }}>
              <label>Daily calorie goal</label>
              <input
                className="kk-input"
                type="number"
                min={800}
                max={8000}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                required
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="kk-btn kk-btn--primary kk-btn--sm" type="submit" disabled={savingGoal}>
                {savingGoal ? "Saving…" : "Save goal"}
              </button>
              <button
                className="kk-btn kk-btn--ghost kk-btn--sm"
                type="button"
                onClick={() => setEditingGoal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ width: "100%", height: 10, background: "var(--kk-bg)", borderRadius: "var(--kk-radius-pill)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, var(--kk-orange), var(--kk-orange-hover))",
                  borderRadius: "var(--kk-radius-pill)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p style={{ marginTop: 10, fontSize: 15 }}>
              <strong>{Math.round(summary.totals.calories)}</strong> / {summary.goal} kcal
              <span style={{ color: "var(--kk-text-muted)" }}> · {summary.remaining} kcal remaining</span>
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 18 }}>
              {MACRO_LABELS.map(([key, label, unit]) => (
                <div key={key} style={{ background: "var(--kk-bg)", borderRadius: "var(--kk-radius-sm)", padding: "10px 4px", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {Math.round(summary.totals[key])}{unit}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--kk-text-muted)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Meals logged that day ── */}
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          {isToday ? "Today's meals" : "Meals logged"} ({logs.length})
        </h3>
        {logs.length === 0 ? (
          <p style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>
            {isToday
              ? 'Nothing logged yet — open any restaurant\'s menu and tap "Log this meal" on a dish.'
              : "Nothing was logged on this day."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {logs.map((log) => (
              <div
                key={log._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--kk-border-light)",
                  fontSize: 14,
                }}
              >
                <div>
                  <strong>{log.dishName}</strong>
                  <span style={{ color: "var(--kk-text-muted)" }}>
                    {" "}· {log.servings}× · {Math.round(log.nutrition.calories)} kcal
                  </span>
                </div>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => handleDeleteLog(log._id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 7-day chart ending on the selected date ── */}
      <Card style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          Week ending {formatDateLabel(selectedDate)}
        </h3>
        <div style={{ width: "100%", height: 220, marginTop: 12 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--kk-border-light)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} kcal`, "Calories"]} />
              <ReferenceLine
                y={week?.goal}
                stroke="var(--kk-red)"
                strokeDasharray="4 4"
                label={{ value: "Goal", position: "right", fontSize: 12, fill: "#E05555" }}
              />
              <Bar dataKey="calories" fill="#E8913A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppLayout>
  );
}
