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
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", dailyCalorieTarget: 2000, budgetPerDay: 500 });

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", dailyCalorieTarget: "", budgetPerDay: "" });

  const [activePlan, setActivePlan] = useState(null);
  const [activeDay, setActiveDay] = useState(DAYS[0]);

  // per-day target editing
  const [editingDayTarget, setEditingDayTarget] = useState(false);
  const [dayTargetForm, setDayTargetForm] = useState({ calorieTarget: "", budgetTarget: "" });

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [dishes, setDishes] = useState([]);
  const [pickerSlot, setPickerSlot] = useState("lunch");

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

  useEffect(() => {
    if (!selectedRestaurant) { setDishes([]); return; }
    api.get(`/dishes/restaurant/${selectedRestaurant}`)
      .then((r) => setDishes(r.data.menu || []))
      .catch(() => setDishes([]));
  }, [selectedRestaurant]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await createMealPlan({
        ...form,
        dailyCalorieTarget: Number(form.dailyCalorieTarget),
        budgetPerDay: Number(form.budgetPerDay),
        days: DAYS.map((d) => ({ dayOfWeek: d, calorieTarget: 0, budgetTarget: 0, meals: [] })),
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

  const startEdit = (plan) => {
    setEditingPlanId(plan._id);
    setEditForm({
      name: plan.name,
      dailyCalorieTarget: plan.dailyCalorieTarget,
      budgetPerDay: plan.budgetPerDay || 0,
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await updateMealPlan(editingPlanId, {
        name: editForm.name,
        dailyCalorieTarget: Number(editForm.dailyCalorieTarget),
        budgetPerDay: Number(editForm.budgetPerDay),
      });
      setMsg("Plan updated!");
      setEditingPlanId(null);
      loadPlans();
      if (activePlan?._id === editingPlanId) openPlan(editingPlanId);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update plan");
    }
  };

  const openPlan = async (id) => {
    try {
      const res = await fetchMealPlan(id);
      setActivePlan(res.plan);
      setActiveDay(DAYS[0]);
      setMsg("");
      setEditingDayTarget(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load plan");
    }
  };

  // ── per-day target editing ──
  const startDayEdit = () => {
    const day = activePlan?.days?.find((d) => d.dayOfWeek === activeDay);
    setDayTargetForm({
      calorieTarget: day?.calorieTarget || "",
      budgetTarget: day?.budgetTarget || "",
    });
    setEditingDayTarget(true);
  };

  const saveDayTarget = async () => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => {
      if (day.dayOfWeek !== activeDay) return day;
      return {
        ...day,
        calorieTarget: Number(dayTargetForm.calorieTarget) || 0,
        budgetTarget: Number(dayTargetForm.budgetTarget) || 0,
      };
    });
    try {
      await updateMealPlan(activePlan._id, { days: updatedDays });
      openPlan(activePlan._id);
      setMsg(`${activeDay} target updated!`);
      setEditingDayTarget(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update day target");
    }
  };

  const resetDayTarget = async () => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => {
      if (day.dayOfWeek !== activeDay) return day;
      return { ...day, calorieTarget: 0, budgetTarget: 0 };
    });
    try {
      await updateMealPlan(activePlan._id, { days: updatedDays });
      openPlan(activePlan._id);
      setMsg(`${activeDay} reset to plan default.`);
      setEditingDayTarget(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset day target");
    }
  };

  const addDish = async (dishId) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => {
      if (day.dayOfWeek !== activeDay) return day;
      return { ...day, meals: [...day.meals, { dish: dishId, mealSlot: pickerSlot }] };
    });
    try {
      await updateMealPlan(activePlan._id, { days: updatedDays });
      openPlan(activePlan._id);
      setMsg("Dish added!");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add dish");
    }
  };

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

  // ── computed values using per-day effective targets ──
  const currentDay = activePlan?.days?.find((d) => d.dayOfWeek === activeDay);
  const totals = currentDay?.totals || {};
  const effectiveCal = currentDay?.effectiveCalorieTarget || activePlan?.dailyCalorieTarget || 9999;
  const effectiveBudget = currentDay?.effectiveBudget || activePlan?.budgetPerDay || 0;
  const isCustomDay = (currentDay?.calorieTarget || 0) > 0 || (currentDay?.budgetTarget || 0) > 0;
  const overCalorie = totals.calories > effectiveCal;
  const overBudget = effectiveBudget > 0 && totals.cost > effectiveBudget;
  const remainingCal = effectiveCal - (totals.calories || 0);
  const remainingBudget = effectiveBudget - (totals.cost || 0);

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  // ════════════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════════════
  if (activePlan) {
    const groupSlotMeals = (slot) => {
      const slotMeals = (currentDay?.meals || []).filter((m) => m.mealSlot === slot);
      const grouped = {};
      slotMeals.forEach((m, idx) => {
        const dishId = m.dish?.toString() || m.dish;
        if (!grouped[dishId]) grouped[dishId] = { dishId, count: 0, indices: [] };
        grouped[dishId].count += 1;
        grouped[dishId].indices.push(idx);
      });
      return Object.values(grouped);
    };

    return (
      <div className="planner-wrap">
        <button onClick={() => setActivePlan(null)} style={{ background: "#777", marginBottom: 12 }}>
          ← Back to plans
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ marginBottom: 4 }}>{activePlan.name}</h1>
          <button onClick={() => startEdit(activePlan)} style={{ padding: "6px 14px", fontSize: 13, background: "#555" }}>
            ✏️ Edit plan
          </button>
        </div>

        <p style={{ color: "#666", marginBottom: 6 }}>
          Default target: {activePlan.dailyCalorieTarget} kcal/day
          {activePlan.budgetPerDay > 0 && ` · ৳${activePlan.budgetPerDay}/day`}
        </p>

        {/* Show effective target for the selected day */}
        <p style={{ color: isCustomDay ? "#2563eb" : "#888", fontWeight: isCustomDay ? 600 : 400, marginBottom: 16, fontSize: 14 }}>
          {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)} target: {effectiveCal} kcal
          {effectiveBudget > 0 && ` · ৳${effectiveBudget}`}
          {isCustomDay && " (custom)"}
        </p>

        {/* Plan edit form */}
        {editingPlanId === activePlan._id && (
          <form onSubmit={handleEdit} style={{ background: "#fff", padding: 16, borderRadius: 10, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <h3 style={{ marginBottom: 10 }}>Edit plan defaults</h3>
            <input placeholder="Plan name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ddd", borderRadius: 6 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="number" placeholder="Default calorie target" value={editForm.dailyCalorieTarget} onChange={(e) => setEditForm({ ...editForm, dailyCalorieTarget: e.target.value })} min="500" max="10000" required style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }} />
              <input type="number" placeholder="Default budget (৳)" value={editForm.budgetPerDay} onChange={(e) => setEditForm({ ...editForm, budgetPerDay: e.target.value })} min="0" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingPlanId(null)} style={{ background: "#777" }}>Cancel</button>
            </div>
          </form>
        )}

        {error && <p className="error">{error}</p>}
        {msg && <p style={{ color: "#2e7d32", fontWeight: 600 }}>{msg}</p>}

        {/* Day tabs */}
        <div>
          {DAYS.map((d) => {
            const dayData = activePlan.days?.find((x) => x.dayOfWeek === d);
            const hasCustom = (dayData?.calorieTarget || 0) > 0 || (dayData?.budgetTarget || 0) > 0;
            return (
              <span
                key={d}
                className={`day-tab ${activeDay === d ? "active" : ""}`}
                onClick={() => { setActiveDay(d); setEditingDayTarget(false); }}
                style={hasCustom && activeDay !== d ? { borderColor: "#2563eb", color: "#2563eb" } : undefined}
                title={hasCustom ? `Custom: ${dayData.calorieTarget || activePlan.dailyCalorieTarget} kcal` : undefined}
              >
                {d.slice(0, 3)}
                {hasCustom && " ★"}
              </span>
            );
          })}
        </div>

        {/* Per-day target editor */}
        <div style={{ marginTop: 10, marginBottom: 6 }}>
          {!editingDayTarget ? (
            <button onClick={startDayEdit} style={{ padding: "5px 12px", fontSize: 12, background: "#2563eb" }}>
              🎯 Set {activeDay} target
            </button>
          ) : (
            <div style={{ background: "#fff", padding: 14, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)} target:
              </label>
              <input
                type="number" placeholder="Calorie target" min="0" max="10000"
                value={dayTargetForm.calorieTarget}
                onChange={(e) => setDayTargetForm({ ...dayTargetForm, calorieTarget: e.target.value })}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, width: 130 }}
              />
              <input
                type="number" placeholder="Budget (৳)" min="0"
                value={dayTargetForm.budgetTarget}
                onChange={(e) => setDayTargetForm({ ...dayTargetForm, budgetTarget: e.target.value })}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, width: 110 }}
              />
              <button onClick={saveDayTarget} style={{ padding: "6px 12px", fontSize: 12 }}>Save</button>
              <button onClick={resetDayTarget} style={{ padding: "6px 12px", fontSize: 12, background: "#777" }}>Reset to default</button>
              <button onClick={() => setEditingDayTarget(false)} style={{ padding: "6px 12px", fontSize: 12, background: "#aaa" }}>Cancel</button>
            </div>
          )}
        </div>

        {/* Totals bar */}
        <div className="totals-bar">
          {MACROS.map(([key, unit]) => (
            <div key={key} className="t-cell">
              <span className={`t-val ${key === "calories" && overCalorie ? "over-limit" : key === "cost" && overBudget ? "over-limit" : "under-limit"}`}>
                {Math.round(totals[key] || 0)}
              </span>
              <span className="t-lbl">{key} {unit}</span>
            </div>
          ))}
        </div>

        {/* Remaining */}
        <div style={{ display: "flex", gap: 20, marginTop: 10, padding: "12px 16px", background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", fontSize: 14, fontWeight: 600 }}>
          <span className={remainingCal < 0 ? "over-limit" : "under-limit"}>
            {remainingCal >= 0
              ? `✅ ${Math.round(remainingCal)} kcal remaining`
              : `⚠️ ${Math.round(Math.abs(remainingCal))} kcal over target`}
          </span>
          {effectiveBudget > 0 && (
            <span className={remainingBudget < 0 ? "over-limit" : "under-limit"}>
              {remainingBudget >= 0
                ? `✅ ৳${Math.round(remainingBudget)} remaining`
                : `⚠️ ৳${Math.round(Math.abs(remainingBudget))} over budget`}
            </span>
          )}
        </div>

        {/* Meals grouped by slot */}
        {SLOTS.map((slot) => {
          const grouped = groupSlotMeals(slot);
          return (
            <div key={slot} className="slot-section">
              <div className="slot-title">{slot}</div>
              {grouped.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>No dishes yet</p>}
              {grouped.map((g) => {
                const dish = dishes.find((d) => d.id === g.dishId || d.id === g.dishId?.toString());
                const cal = dish?.nutrition?.calories || 0;
                const price = dish?.price || 0;
                return (
                  <div key={g.dishId} className="meal-item">
                    <span>
                      {dish?.name || "Loading…"}
                      {g.count > 1 && <strong style={{ color: "#d64545", marginLeft: 8 }}>×{g.count}</strong>}
                    </span>
                    <div>
                      <small style={{ color: "#888", marginRight: 10 }}>
                        {cal * g.count} kcal · ৳{price * g.count}
                        {g.count > 1 && ` (${cal} each)`}
                      </small>
                      <button onClick={() => removeMeal(activeDay, g.indices[g.indices.length - 1])} style={{ padding: "4px 10px", fontSize: 12, background: "#b93a3a" }} title="Remove one">✕</button>
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
          <select value={pickerSlot} onChange={(e) => setPickerSlot(e.target.value)}>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)}>
            <option value="">Pick a restaurant</option>
            {restaurants.map((r) => <option key={r._id} value={r._id}>{r.businessName}</option>)}
          </select>
          {dishes.length > 0 && (
            <div style={{ marginTop: 10, maxHeight: 300, overflowY: "auto" }}>
              {dishes.map((d) => (
                <div key={d.id} className="dish-option" onClick={() => addDish(d.id)}>
                  <div>
                    <strong>{d.name}</strong><br />
                    <small style={{ color: "#888" }}>{d.nutrition?.calories || 0} kcal · ৳{d.price} · {d.dietaryTags?.join(", ") || "no tags"}</small>
                  </div>
                  <button style={{ padding: "6px 14px", fontSize: 13 }} onClick={(e) => { e.stopPropagation(); addDish(d.id); }}>+ Add</button>
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

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: "#fff", padding: 20, borderRadius: 10, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <input placeholder="Plan name (e.g. Healthy Week)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ddd", borderRadius: 6 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input type="number" placeholder="Daily calorie target" value={form.dailyCalorieTarget} onChange={(e) => setForm({ ...form, dailyCalorieTarget: e.target.value })} min="500" max="10000" required style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }} />
            <input type="number" placeholder="Budget per day (৳)" value={form.budgetPerDay} onChange={(e) => setForm({ ...form, budgetPerDay: e.target.value })} min="0" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }} />
          </div>
          <button type="submit">Create plan</button>
        </form>
      )}

      {plans.length === 0 && !showCreate && <p style={{ color: "#666" }}>No meal plans yet. Create your first one!</p>}

      {plans.map((pl) => (
        <div key={pl._id} className="plan-card">
          {editingPlanId === pl._id ? (
            <form onSubmit={handleEdit} style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, flex: 1 }} />
              <input type="number" value={editForm.dailyCalorieTarget} onChange={(e) => setEditForm({ ...editForm, dailyCalorieTarget: e.target.value })} min="500" max="10000" required style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, width: 100 }} />
              <input type="number" value={editForm.budgetPerDay} onChange={(e) => setEditForm({ ...editForm, budgetPerDay: e.target.value })} min="0" style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, width: 80 }} />
              <button type="submit" style={{ padding: "6px 12px", fontSize: 13 }}>Save</button>
              <button type="button" onClick={() => setEditingPlanId(null)} style={{ padding: "6px 12px", fontSize: 13, background: "#777" }}>✕</button>
            </form>
          ) : (
            <>
              <div>
                <h3>{pl.name}</h3>
                <small style={{ color: "#666" }}>{pl.dailyCalorieTarget} kcal/day{pl.budgetPerDay > 0 && ` · ৳${pl.budgetPerDay}/day`}</small>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openPlan(pl._id)} style={{ padding: "6px 14px", fontSize: 13 }}>Open</button>
                <button onClick={() => startEdit(pl)} style={{ padding: "6px 14px", fontSize: 13, background: "#555" }}>Edit</button>
                <button onClick={() => handleDelete(pl._id)} style={{ padding: "6px 14px", fontSize: 13, background: "#b93a3a" }}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}