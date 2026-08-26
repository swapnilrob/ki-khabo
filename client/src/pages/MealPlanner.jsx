import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyMealPlans, fetchMealPlan, createMealPlan, updateMealPlan, deleteMealPlan,
} from "../api/mealPlanner";
import { fetchRestaurants } from "../api/dishes";
import api from "../api/axios";
import "../styles/mealPlanner.css";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui";

const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const SLOTS = ["breakfast", "lunch", "dinner", "snack"];
const MACROS = [["calories", "kcal"], ["protein", "g"], ["carbohydrates", "g"], ["fat", "g"], ["cost", "৳"]];

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
  const [editingDayTarget, setEditingDayTarget] = useState(false);
  const [dayTargetForm, setDayTargetForm] = useState({ calorieTarget: "", budgetTarget: "" });
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [dishes, setDishes] = useState([]);
  const [pickerSlot, setPickerSlot] = useState("lunch");

  const loadPlans = async () => {
    try { const res = await fetchMyMealPlans(); setPlans(res.plans || []); }
    catch (err) { setError(err.response?.data?.message || "Could not load plans"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPlans(); fetchRestaurants().then((r) => setRestaurants(r.restaurants || [])).catch(() => {}); }, []);
  useEffect(() => { if (!selectedRestaurant) { setDishes([]); return; } api.get(`/dishes/restaurant/${selectedRestaurant}`).then((r) => setDishes(r.data.menu || [])).catch(() => setDishes([])); }, [selectedRestaurant]);

  const handleCreate = async (e) => {
    e.preventDefault(); setError("");
    try {
      const res = await createMealPlan({ ...form, dailyCalorieTarget: Number(form.dailyCalorieTarget), budgetPerDay: Number(form.budgetPerDay), days: DAYS.map((d) => ({ dayOfWeek: d, calorieTarget: 0, budgetTarget: 0, meals: [] })) });
      setMsg("Plan created!"); setShowCreate(false); setForm({ name: "", dailyCalorieTarget: 2000, budgetPerDay: 500 }); loadPlans(); openPlan(res.plan._id);
    } catch (err) { setError(err.response?.data?.message || "Could not create plan"); }
  };

  const startEdit = (plan) => { setEditingPlanId(plan._id); setEditForm({ name: plan.name, dailyCalorieTarget: plan.dailyCalorieTarget, budgetPerDay: plan.budgetPerDay || 0 }); };
  const handleEdit = async (e) => {
    e.preventDefault(); setError("");
    try { await updateMealPlan(editingPlanId, { name: editForm.name, dailyCalorieTarget: Number(editForm.dailyCalorieTarget), budgetPerDay: Number(editForm.budgetPerDay) }); setMsg("Plan updated!"); setEditingPlanId(null); loadPlans(); if (activePlan?._id === editingPlanId) openPlan(editingPlanId); }
    catch (err) { setError(err.response?.data?.message || "Could not update plan"); }
  };

  const openPlan = async (id) => { try { const res = await fetchMealPlan(id); setActivePlan(res.plan); setActiveDay(DAYS[0]); setMsg(""); setEditingDayTarget(false); } catch (err) { setError(err.response?.data?.message || "Could not load plan"); } };
  const startDayEdit = () => { const day = activePlan?.days?.find((d) => d.dayOfWeek === activeDay); setDayTargetForm({ calorieTarget: day?.calorieTarget || "", budgetTarget: day?.budgetTarget || "" }); setEditingDayTarget(true); };

  const saveDayTarget = async () => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => day.dayOfWeek !== activeDay ? day : { ...day, calorieTarget: Number(dayTargetForm.calorieTarget) || 0, budgetTarget: Number(dayTargetForm.budgetTarget) || 0 });
    try { await updateMealPlan(activePlan._id, { days: updatedDays }); openPlan(activePlan._id); setMsg(`${activeDay} target updated!`); setEditingDayTarget(false); }
    catch (err) { setError(err.response?.data?.message || "Could not update day target"); }
  };

  const resetDayTarget = async () => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => day.dayOfWeek !== activeDay ? day : { ...day, calorieTarget: 0, budgetTarget: 0 });
    try { await updateMealPlan(activePlan._id, { days: updatedDays }); openPlan(activePlan._id); setMsg(`${activeDay} reset to plan default.`); setEditingDayTarget(false); }
    catch (err) { setError(err.response?.data?.message || "Could not reset day target"); }
  };

  const addDish = async (dishId) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => day.dayOfWeek !== activeDay ? day : { ...day, meals: [...day.meals, { dish: dishId, mealSlot: pickerSlot }] });
    try { await updateMealPlan(activePlan._id, { days: updatedDays }); openPlan(activePlan._id); setMsg("Dish added!"); }
    catch (err) { setError(err.response?.data?.message || "Could not add dish"); }
  };

  const removeMeal = async (dayOfWeek, mealIndex) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => { if (day.dayOfWeek !== dayOfWeek) return day; const m = [...day.meals]; m.splice(mealIndex, 1); return { ...day, meals: m }; });
    try { await updateMealPlan(activePlan._id, { days: updatedDays }); openPlan(activePlan._id); }
    catch (err) { setError(err.response?.data?.message || "Could not remove dish"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this meal plan?")) return;
    try { await deleteMealPlan(id); setMsg("Plan deleted."); if (activePlan?._id === id) setActivePlan(null); loadPlans(); }
    catch (err) { setError(err.response?.data?.message || "Could not delete plan"); }
  };

  const currentDay = activePlan?.days?.find((d) => d.dayOfWeek === activeDay);
  const totals = currentDay?.totals || {};
  const effectiveCal = currentDay?.effectiveCalorieTarget || activePlan?.dailyCalorieTarget || 9999;
  const effectiveBudget = currentDay?.effectiveBudget || activePlan?.budgetPerDay || 0;
  const isCustomDay = (currentDay?.calorieTarget || 0) > 0 || (currentDay?.budgetTarget || 0) > 0;
  const overCalorie = totals.calories > effectiveCal;
  const overBudget = effectiveBudget > 0 && totals.cost > effectiveBudget;
  const remainingCal = effectiveCal - (totals.calories || 0);
  const remainingBudget = effectiveBudget - (totals.cost || 0);

  if (loading) return <AppLayout><p style={{ padding: 24, color: "var(--kk-text-muted)" }}>Loading…</p></AppLayout>;

  // ════════════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════════════
  if (activePlan) {
    const groupSlotMeals = (slot) => {
      const slotMeals = (currentDay?.meals || []).filter((m) => m.mealSlot === slot);
      const grouped = {};
      slotMeals.forEach((m, idx) => { const id = m.dish?.toString() || m.dish; if (!grouped[id]) grouped[id] = { dishId: id, count: 0, indices: [] }; grouped[id].count++; grouped[id].indices.push(idx); });
      return Object.values(grouped);
    };

    return (
      <AppLayout>
        <div className="planner-wrap">
          <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setActivePlan(null)} style={{ marginBottom: "var(--kk-space-3)" }}>
            ← Back to plans
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--kk-space-1)" }}>
            <h2 className="kk-page-title">{activePlan.name}</h2>
            <button className="kk-btn kk-btn--secondary kk-btn--sm" onClick={() => startEdit(activePlan)}>✏️ Edit plan</button>
          </div>

          <p className="kk-page-subtitle" style={{ marginBottom: "var(--kk-space-1)" }}>
            Default target: {activePlan.dailyCalorieTarget} kcal/day
            {activePlan.budgetPerDay > 0 && ` · ৳${activePlan.budgetPerDay}/day`}
          </p>

          <p style={{ color: isCustomDay ? "var(--kk-blue)" : "var(--kk-text-muted)", fontWeight: isCustomDay ? 600 : 400, marginBottom: "var(--kk-space-4)", fontSize: 14 }}>
            {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)} target: {effectiveCal} kcal
            {effectiveBudget > 0 && ` · ৳${effectiveBudget}`}
            {isCustomDay && " (custom)"}
          </p>

          {editingPlanId === activePlan._id && (
            <Card style={{ padding: "var(--kk-space-5)", marginBottom: "var(--kk-space-4)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-3)" }}>Edit plan defaults</h3>
              <div className="kk-input-group"><label>Plan name</label><input className="kk-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
              <div style={{ display: "flex", gap: "var(--kk-space-2)", margin: "var(--kk-space-2) 0 var(--kk-space-3)" }}>
                <div className="kk-input-group" style={{ flex: 1 }}><label>Calorie target</label><input className="kk-input" type="number" value={editForm.dailyCalorieTarget} onChange={(e) => setEditForm({ ...editForm, dailyCalorieTarget: e.target.value })} min="500" max="10000" required /></div>
                <div className="kk-input-group" style={{ flex: 1 }}><label>Budget (৳)</label><input className="kk-input" type="number" value={editForm.budgetPerDay} onChange={(e) => setEditForm({ ...editForm, budgetPerDay: e.target.value })} min="0" /></div>
              </div>
              <div style={{ display: "flex", gap: "var(--kk-space-2)" }}>
                <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={handleEdit}>Save</button>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setEditingPlanId(null)}>Cancel</button>
              </div>
            </Card>
          )}

          {error && <div style={{ background: "var(--kk-red-light)", color: "var(--kk-red)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", marginBottom: "var(--kk-space-3)", fontSize: 13 }}>{error}</div>}
          {msg && <div style={{ background: "var(--kk-green-light)", color: "var(--kk-green)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", marginBottom: "var(--kk-space-3)", fontSize: 13, fontWeight: 500 }}>{msg}</div>}

          <div>
            {DAYS.map((d) => {
              const dayData = activePlan.days?.find((x) => x.dayOfWeek === d);
              const hasCustom = (dayData?.calorieTarget || 0) > 0 || (dayData?.budgetTarget || 0) > 0;
              return (
                <span key={d} className={`day-tab ${activeDay === d ? "active" : ""}`} onClick={() => { setActiveDay(d); setEditingDayTarget(false); }}
                  style={hasCustom && activeDay !== d ? { borderColor: "var(--kk-blue)", color: "var(--kk-blue)" } : undefined}
                  title={hasCustom ? `Custom: ${dayData.calorieTarget || activePlan.dailyCalorieTarget} kcal` : undefined}>
                  {d.slice(0, 3)}{hasCustom && " ★"}
                </span>
              );
            })}
          </div>

          <div style={{ marginTop: "var(--kk-space-3)", marginBottom: "var(--kk-space-2)" }}>
            {!editingDayTarget ? (
              <button className="kk-btn kk-btn--outline kk-btn--sm" onClick={startDayEdit}>🎯 Set {activeDay} target</button>
            ) : (
              <Card compact style={{ display: "flex", gap: "var(--kk-space-2)", alignItems: "center", flexWrap: "wrap", padding: "var(--kk-space-3)" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--kk-text-secondary)" }}>{activeDay.charAt(0).toUpperCase() + activeDay.slice(1)}:</label>
                <input className="kk-input" type="number" placeholder="Calories" min="0" max="10000" value={dayTargetForm.calorieTarget} onChange={(e) => setDayTargetForm({ ...dayTargetForm, calorieTarget: e.target.value })} style={{ width: 120 }} />
                <input className="kk-input" type="number" placeholder="Budget ৳" min="0" value={dayTargetForm.budgetTarget} onChange={(e) => setDayTargetForm({ ...dayTargetForm, budgetTarget: e.target.value })} style={{ width: 100 }} />
                <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={saveDayTarget}>Save</button>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={resetDayTarget}>Reset</button>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setEditingDayTarget(false)}>Cancel</button>
              </Card>
            )}
          </div>

          <div className="totals-bar">
            {MACROS.map(([key, unit]) => (
              <div key={key} className="t-cell">
                <span className={`t-val ${key === "calories" && overCalorie ? "over-limit" : key === "cost" && overBudget ? "over-limit" : "under-limit"}`}>{Math.round(totals[key] || 0)}</span>
                <span className="t-lbl">{key} {unit}</span>
              </div>
            ))}
          </div>

          <Card compact style={{ display: "flex", gap: "var(--kk-space-5)", marginTop: "var(--kk-space-3)", padding: "var(--kk-space-3) var(--kk-space-4)", fontSize: 14, fontWeight: 600 }}>
            <span className={remainingCal < 0 ? "over-limit" : "under-limit"}>
              {remainingCal >= 0 ? `✅ ${Math.round(remainingCal)} kcal remaining` : `⚠️ ${Math.round(Math.abs(remainingCal))} kcal over target`}
            </span>
            {effectiveBudget > 0 && (
              <span className={remainingBudget < 0 ? "over-limit" : "under-limit"}>
                {remainingBudget >= 0 ? `✅ ৳${Math.round(remainingBudget)} remaining` : `⚠️ ৳${Math.round(Math.abs(remainingBudget))} over budget`}
              </span>
            )}
          </Card>

          {SLOTS.map((slot) => {
            const grouped = groupSlotMeals(slot);
            return (
              <div key={slot} className="slot-section">
                <div className="slot-title">{slot}</div>
                {grouped.length === 0 && <p style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>No dishes yet</p>}
                {grouped.map((g) => {
                  const dish = dishes.find((d) => d.id === g.dishId || d.id === g.dishId?.toString());
                  const cal = dish?.nutrition?.calories || 0;
                  const price = dish?.price || 0;
                  return (
                    <div key={g.dishId} className="meal-item">
                      <span>
                        {dish?.name || "Loading…"}
                        {g.count > 1 && <strong style={{ color: "var(--kk-orange)", marginLeft: 8 }}>×{g.count}</strong>}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--kk-space-2)" }}>
                        <small style={{ color: "var(--kk-text-muted)" }}>
                          {cal * g.count} kcal · ৳{price * g.count}
                          {g.count > 1 && ` (${cal} each)`}
                        </small>
                        <button className="kk-btn kk-btn--danger kk-btn--sm" onClick={() => removeMeal(activeDay, g.indices[g.indices.length - 1])} title="Remove one" style={{ padding: "4px 10px" }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="dish-picker">
            <h3 style={{ marginBottom: "var(--kk-space-3)" }}>Add a dish to {activeDay}</h3>
            <select value={pickerSlot} onChange={(e) => setPickerSlot(e.target.value)}>
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)}>
              <option value="">Pick a restaurant</option>
              {restaurants.map((r) => <option key={r._id} value={r._id}>{r.businessName}</option>)}
            </select>
            {dishes.length > 0 && (
              <div style={{ marginTop: "var(--kk-space-3)", maxHeight: 300, overflowY: "auto" }}>
                {dishes.map((d) => (
                  <div key={d.id} className="dish-option" onClick={() => addDish(d.id)}>
                    <div>
                      <strong>{d.name}</strong><br />
                      <small>{d.nutrition?.calories || 0} kcal · ৳{d.price} · {d.dietaryTags?.join(", ") || "no tags"}</small>
                    </div>
                    <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={(e) => { e.stopPropagation(); addDish(d.id); }}>+ Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════
  return (
    <AppLayout>
      <div className="planner-wrap">
        <h2 className="kk-page-title">Meal Planner</h2>
        <p className="kk-page-subtitle">Plan your weekly meals with calorie and budget tracking.</p>

        {error && <div style={{ background: "var(--kk-red-light)", color: "var(--kk-red)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", marginBottom: "var(--kk-space-4)", fontSize: 13 }}>{error}</div>}
        {msg && <div style={{ background: "var(--kk-green-light)", color: "var(--kk-green)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", marginBottom: "var(--kk-space-4)", fontSize: 13, fontWeight: 500 }}>{msg}</div>}

        <button className="kk-btn kk-btn--primary" onClick={() => setShowCreate(!showCreate)} style={{ marginBottom: "var(--kk-space-4)" }}>
          {showCreate ? "Cancel" : "+ New meal plan"}
        </button>

        {showCreate && (
          <Card style={{ padding: "var(--kk-space-5)", marginBottom: "var(--kk-space-4)" }}>
            <div className="kk-input-group"><label>Plan name</label><input className="kk-input" placeholder="e.g. Healthy Week" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div style={{ display: "flex", gap: "var(--kk-space-2)", margin: "var(--kk-space-2) 0 var(--kk-space-3)" }}>
              <div className="kk-input-group" style={{ flex: 1 }}><label>Daily calorie target</label><input className="kk-input" type="number" value={form.dailyCalorieTarget} onChange={(e) => setForm({ ...form, dailyCalorieTarget: e.target.value })} min="500" max="10000" required /></div>
              <div className="kk-input-group" style={{ flex: 1 }}><label>Budget per day (৳)</label><input className="kk-input" type="number" value={form.budgetPerDay} onChange={(e) => setForm({ ...form, budgetPerDay: e.target.value })} min="0" /></div>
            </div>
            <button className="kk-btn kk-btn--primary" onClick={handleCreate}>Create plan</button>
          </Card>
        )}

        {plans.length === 0 && !showCreate && (
          <Card style={{ textAlign: "center", padding: "var(--kk-space-8) var(--kk-space-5)", color: "var(--kk-text-muted)" }}>
            No meal plans yet. Create your first one!
          </Card>
        )}

        {plans.map((pl) => (
          <div key={pl._id} className="plan-card">
            {editingPlanId === pl._id ? (
              <div style={{ display: "flex", gap: "var(--kk-space-2)", alignItems: "center", flex: 1 }}>
                <input className="kk-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required style={{ flex: 1 }} />
                <input className="kk-input" type="number" value={editForm.dailyCalorieTarget} onChange={(e) => setEditForm({ ...editForm, dailyCalorieTarget: e.target.value })} min="500" max="10000" required style={{ width: 100 }} />
                <input className="kk-input" type="number" value={editForm.budgetPerDay} onChange={(e) => setEditForm({ ...editForm, budgetPerDay: e.target.value })} min="0" style={{ width: 80 }} />
                <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={handleEdit}>Save</button>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setEditingPlanId(null)}>✕</button>
              </div>
            ) : (
              <>
                <div>
                  <h3>{pl.name}</h3>
                  <small>{pl.dailyCalorieTarget} kcal/day{pl.budgetPerDay > 0 && (" · ৳" + pl.budgetPerDay + "/day")}</small>
                </div>
                <div style={{ display: "flex", gap: "var(--kk-space-2)" }}>
                  <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => openPlan(pl._id)}>Open</button>
                  <button className="kk-btn kk-btn--secondary kk-btn--sm" onClick={() => startEdit(pl)}>Edit</button>
                  <button className="kk-btn kk-btn--danger kk-btn--sm" onClick={() => handleDelete(pl._id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}