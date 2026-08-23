import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyMealPlans,
  fetchMealPlan,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../api/mealPlanner";
import { fetchRestaurants } from "../api/dishes";
import api from "../api/axios";
import "../styles/mealPlanner.css";

const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const SLOTS = ["breakfast", "lunch", "dinner", "snack"];
const MACROS = [
  ["calories", "kcal"],
  ["protein", "g"],
  ["carbohydrates", "g"],
  ["fat", "g"],
  ["cost", "৳"],
];

export default function MealPlanner() {
  // ── list view state ──
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // ── create form state ──
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", dailyCalorieTarget: 2000, budgetPerDay: 500 });

  // ── detail view state ──
  const [activePlan, setActivePlan] = useState(null);
  const [activeDay, setActiveDay] = useState(DAYS[0]);

  // ── dish picker state ──
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [dishes, setDishes] = useState([]);
  const [pickerSlot, setPickerSlot] = useState("lunch");

  // ── load plans ──
  const loadPlans = async () => {
    try {
      const res = await fetchMyMealPlans();
      setPlans(res.plans || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    fetchRestaurants()
      .then((res) => setRestaurants(res.restaurants || []))
      .catch(() => {});
  }, []);

  // ── load dishes when restaurant changes ──
  useEffect(() => {
    if (!selectedRestaurant) {
      setDishes([]);
      return;
    }
    api
      .get(`/dishes/restaurant/${selectedRestaurant}`)
      .then((r) => setDishes(r.data.menu || []))
      .catch(() => setDishes([]));
  }, [selectedRestaurant]);

  // ── create a plan ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await createMealPlan({
        ...form,
        dailyCalorieTarget: Number(form.dailyCalorieTarget),
        budgetPerDay: Number(form.budgetPerDay),
        days: DAYS.map((d) => ({ dayOfWeek: d, meals: [] })),
      });
      setMsg("Plan created!");
      setShowCreate(false);
      setForm({ name: "", dailyCalorieTarget: 2000, budgetPerDay: 500 });
      loadPlans();
      openPlan(res.plan._id);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create plan");
    }
  };

  // ── open a plan ──
  const openPlan = async (id) => {
    try {
      const res = await fetchMealPlan(id);
      setActivePlan(res.plan);
      setActiveDay(DAYS[0]);
      setMsg("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load plan");
    }
  };

  // ── add a dish to the active day ──
  const addDish = async (dishId) => {
    if (!activePlan) return;

    const updatedDays = activePlan.days.map((day) => {
      if (day.dayOfWeek !== activeDay) return day;
      return {
        ...day,
        meals: [...day.meals, { dish: dishId, mealSlot: pickerSlot }],
      };
    });

    try {
      await updateMealPlan(activePlan._id, { days: updatedDays });
      openPlan(activePlan._id);
      setMsg("Dish added!");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add dish");
    }
  };

  // ── remove a dish from a day ──
  const removeMeal = async (dayOfWeek, mealIndex) => {
    if (!activePlan) return;

    const updatedDays = activePlan.days.map((day) => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      const newMeals = [...day.meals];
      newMeals.splice(mealIndex, 1);
      return { ...day, meals: newMeals };
    });

    try {
      await updateMealPlan(activePlan._id, { days: updatedDays });
      openPlan(activePlan._id);
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove dish");
    }
  };

  // ── delete a plan ──
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this meal plan?")) return;
    try {
      await deleteMealPlan(id);
      setMsg("Plan deleted.");
      if (activePlan?._id === id) setActivePlan(null);
      loadPlans();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete plan");
    }
  };

  // ── get the current day's data ──
  const currentDay = activePlan?.days?.find((d) => d.dayOfWeek === activeDay);
  const totals = currentDay?.totals || {};
  const overCalorie = totals.calories > (activePlan?.dailyCalorieTarget || 9999);
  const overBudget =
    activePlan?.budgetPerDay > 0 && totals.cost > activePlan.budgetPerDay;

  // ── loading ──
  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  // ════════════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════════════
  if (activePlan) {
    return (
      <div className="planner-wrap">
        <button
          onClick={() => setActivePlan(null)}
          style={{ background: "#777", marginBottom: 12 }}
        >
          ← Back to plans
        </button>

        <h1 style={{ marginBottom: 4 }}>{activePlan.name}</h1>
        <p style={{ color: "#666", marginBottom: 16 }}>
          Target: {activePlan.dailyCalorieTarget} kcal/day
          {activePlan.budgetPerDay > 0 && ` · Budget: ৳${activePlan.budgetPerDay}/day`}
        </p>

        {error && <p className="error">{error}</p>}
        {msg && <p style={{ color: "#2e7d32", fontWeight: 600 }}>{msg}</p>}

        {/* Day tabs */}
        <div>
          {DAYS.map((d) => (
            <span
              key={d}
              className={`day-tab ${activeDay === d ? "active" : ""}`}
              onClick={() => setActiveDay(d)}
            >
              {d.slice(0, 3)}
            </span>
          ))}
        </div>

        {/* Totals bar */}
        <div className="totals-bar">
          {MACROS.map(([key, unit]) => (
            <div key={key} className="t-cell">
              <span
                className={`t-val ${
                  key === "calories" && overCalorie
                    ? "over-limit"
                    : key === "cost" && overBudget
                    ? "over-limit"
                    : "under-limit"
                }`}
              >
                {Math.round(totals[key] || 0)}
              </span>
              <span className="t-lbl">
                {key} {unit}
              </span>
            </div>
          ))}
        </div>

        {overCalorie && (
          <p style={{ color: "#c0392b", fontWeight: 600, marginTop: 8 }}>
            ⚠️ This day exceeds your {activePlan.dailyCalorieTarget} kcal target!
          </p>
        )}
        {overBudget && (
          <p style={{ color: "#c0392b", fontWeight: 600, marginTop: 4 }}>
            ⚠️ This day exceeds your ৳{activePlan.budgetPerDay} budget!
          </p>
        )}

        {/* Meals grouped by slot */}
        {SLOTS.map((slot) => {
          const slotMeals = (currentDay?.meals || [])
            .map((m, idx) => ({ ...m, _idx: idx }))
            .filter((m) => m.mealSlot === slot);

          return (
            <div key={slot} className="slot-section">
              <div className="slot-title">{slot}</div>
              {slotMeals.length === 0 && (
                <p style={{ color: "#aaa", fontSize: 13 }}>No dishes yet</p>
              )}
              {slotMeals.map((m) => {
                const dish = dishes.find(
                  (d) => d.id === m.dish || d.id === m.dish?.toString()
                );
                return (
                  <div key={m._idx} className="meal-item">
                    <span>{dish?.name || "Loading…"}</span>
                    <div>
                      <small style={{ color: "#888", marginRight: 10 }}>
                        {dish ? `${dish.nutrition?.calories || 0} kcal · ৳${dish.price}` : ""}
                      </small>
                      <button
                        onClick={() => removeMeal(activeDay, m._idx)}
                        style={{ padding: "4px 10px", fontSize: 12, background: "#b93a3a" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Dish picker */}
        <div className="dish-picker">
          <h3 style={{ marginBottom: 10 }}>Add a dish to {activeDay}</h3>

          <select
            value={pickerSlot}
            onChange={(e) => setPickerSlot(e.target.value)}
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            <option value="">Pick a restaurant</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.businessName}
              </option>
            ))}
          </select>

          {dishes.length > 0 && (
            <div style={{ marginTop: 10, maxHeight: 300, overflowY: "auto" }}>
              {dishes.map((d) => (
                <div
                  key={d.id}
                  className="dish-option"
                  onClick={() => addDish(d.id)}
                >
                  <div>
                    <strong>{d.name}</strong>
                    <br />
                    <small style={{ color: "#888" }}>
                      {d.nutrition?.calories || 0} kcal · ৳{d.price} ·{" "}
                      {d.dietaryTags?.join(", ") || "no tags"}
                    </small>
                  </div>
                  <button
                    style={{ padding: "6px 14px", fontSize: 13 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      addDish(d.id);
                    }}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════
  return (
    <div className="planner-wrap">
      <Link to="/app">← Dashboard</Link>
      <h1 style={{ margin: "12px 0 16px" }}>Meal Planner</h1>

      {error && <p className="error">{error}</p>}
      {msg && <p style={{ color: "#2e7d32", fontWeight: 600 }}>{msg}</p>}

      <button onClick={() => setShowCreate(!showCreate)} style={{ marginBottom: 16 }}>
        {showCreate ? "Cancel" : "+ New meal plan"}
      </button>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 10,
            marginBottom: 16,
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          <input
            placeholder="Plan name (e.g. Healthy Week)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="number"
              placeholder="Daily calorie target"
              value={form.dailyCalorieTarget}
              onChange={(e) => setForm({ ...form, dailyCalorieTarget: e.target.value })}
              min="500"
              max="10000"
              required
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
            />
            <input
              type="number"
              placeholder="Budget per day (৳)"
              value={form.budgetPerDay}
              onChange={(e) => setForm({ ...form, budgetPerDay: e.target.value })}
              min="0"
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
            />
          </div>
          <button type="submit">Create plan</button>
        </form>
      )}

      {/* Existing plans */}
      {plans.length === 0 && !showCreate && (
        <p style={{ color: "#666" }}>No meal plans yet. Create your first one!</p>
      )}

      {plans.map((p) => (
        <div key={p._id} className="plan-card">
          <div>
            <h3>{p.name}</h3>
            <small style={{ color: "#666" }}>
              {p.dailyCalorieTarget} kcal/day
              {p.budgetPerDay > 0 && ` · ৳${p.budgetPerDay}/day`}
            </small>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => openPlan(p._id)} style={{ padding: "6px 14px", fontSize: 13 }}>
              Open
            </button>
            <button
              onClick={() => handleDelete(p._id)}
              style={{ padding: "6px 14px", fontSize: 13, background: "#b93a3a" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}