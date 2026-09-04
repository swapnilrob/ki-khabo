import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyMenu, createDish, updateDish, deleteDish,
} from "../api/dishes";
import "../styles/menu.css";

const CATEGORIES = ["appetizer", "main", "dessert", "beverage", "side", "combo"];
const DIET_TAGS = [
  "vegan", "vegetarian", "halal", "keto", "gluten-free",
  "dairy-free", "nut-free", "low-carb", "high-protein",
];
const ALLERGENS = ["nuts", "dairy", "shellfish", "eggs", "soy", "gluten", "fish", "sesame"];
const NUTRIENTS = ["calories", "protein", "carbohydrates", "fat", "sugar", "sodium", "fiber"];

const emptyForm = {
  name: "", description: "", price: "", category: "main",
  dietaryTags: [], allergens: [],
  nutrition: { calories: "", protein: "", carbohydrates: "", fat: "", sugar: "", sodium: "", fiber: "" },
};

export default function OwnerMenu() {
  const [dishes, setDishes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetchMyMenu();
      setDishes(res.dishes);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const changeNutrition = (e) =>
    setForm({ ...form, nutrition: { ...form.nutrition, [e.target.name]: e.target.value } });

  const toggleInList = (field, value) =>
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((x) => x !== value)
        : [...f[field], value],
    }));

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const startEdit = (d) => {
    setEditingId(d.id);
    setError("");
    setMsg("");
    setForm({
      name: d.name,
      description: d.description || "",
      price: d.price,
      category: d.category,
      dietaryTags: d.dietaryTags || [],
      allergens: d.allergens || [],
      nutrition: NUTRIENTS.reduce(
        (acc, k) => ({ ...acc, [k]: d.nutrition?.[k] ?? "" }), {}
      ),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setBusy(true);

    // Blank number inputs become 0, not empty strings
    const payload = {
      ...form,
      price: Number(form.price),
      nutrition: NUTRIENTS.reduce(
        (acc, k) => ({ ...acc, [k]: Number(form.nutrition[k]) || 0 }), {}
      ),
    };

    try {
      if (editingId) {
        await updateDish(editingId, payload);
        setMsg("Dish updated.");
      } else {
        await createDish(payload);
        setMsg("Dish added.");
      }
      reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the dish");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Remove "${d.name}" from your menu?`)) return;
    try {
      await deleteDish(d.id);
      setMsg("Dish removed.");
      if (editingId === d.id) reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove the dish");
    }
  };

  const toggleAvailable = async (d) => {
    try {
      await updateDish(d.id, { isAvailable: !d.isAvailable });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update availability");
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="profile-wrap">
      <Link to="/owner">← Owner dashboard</Link>
      <h1 style={{ margin: "12px 0 16px" }}>Manage Menu</h1>

      {error && <p className="error">{error}</p>}
      {msg && <p style={{ color: "#2e7d32", fontWeight: 600 }}>{msg}</p>}

      {/* ── Add / edit form ── */}
      <form onSubmit={submit} className="profile-header">
        <h3 style={{ marginBottom: 12 }}>
          {editingId ? "Edit dish" : "Add a new dish"}
        </h3>

        <input
          name="name" placeholder="Dish name" value={form.name}
          onChange={change} required
          style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <textarea
          name="description" placeholder="Description" value={form.description}
          onChange={change} rows={2}
          style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ddd", borderRadius: 6, fontFamily: "inherit" }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            name="price" type="number" min="0" step="1" placeholder="Price (৳)"
            value={form.price} onChange={change} required
            style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <select
            name="category" value={form.category} onChange={change}
            style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Dietary tags</p>
        <div style={{ marginBottom: 10 }}>
          {DIET_TAGS.map((t) => (
            <span
              key={t}
              onClick={() => toggleInList("dietaryTags", t)}
              className="tag"
              style={{
                cursor: "pointer",
                background: form.dietaryTags.includes(t) ? "#1e7d34" : "#eee",
                color: form.dietaryTags.includes(t) ? "#fff" : "#666",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Allergens</p>
        <div style={{ marginBottom: 12 }}>
          {ALLERGENS.map((a) => (
            <span
              key={a}
              onClick={() => toggleInList("allergens", a)}
              className="tag"
              style={{
                cursor: "pointer",
                background: form.allergens.includes(a) ? "#c0392b" : "#eee",
                color: form.allergens.includes(a) ? "#fff" : "#666",
              }}
            >
              {a}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Nutrition (per serving)
        </p>
        <div className="nutrition-grid" style={{ borderTop: "none", paddingTop: 0 }}>
          {NUTRIENTS.map((k) => (
            <div key={k}>
              <label style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>
                {k}
              </label>
              <input
                name={k} type="number" min="0" value={form.nutrition[k]}
                onChange={changeNutrition} placeholder="0"
                style={{ width: "100%", padding: 7, border: "1px solid #ddd", borderRadius: 6 }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Add dish"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} style={{ background: "#777" }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ── Existing menu ── */}
      <h2 style={{ fontSize: 20, marginTop: 24 }}>Your dishes ({dishes.length})</h2>
      {dishes.length === 0 && <p style={{ color: "#666" }}>No dishes yet. Add your first one above.</p>}

      {dishes.map((d) => (
        <div key={d.id} className="dish-card">
          <div className="dish-top">
            <span className="dish-name">
              {d.name}{" "}
              {!d.isAvailable && (
                <small style={{ color: "#c0392b", fontWeight: 400 }}>(hidden)</small>
              )}
            </span>
            <span className="dish-price">৳{d.price}</span>
          </div>

          <p className="dish-desc">
            {d.category} · {d.nutrition?.calories ?? 0} kcal
            {d.description ? ` · ${d.description}` : ""}
          </p>

          <div>
            {d.dietaryTags?.map((t) => <span key={t} className="tag tag-diet">{t}</span>)}
            {d.allergens?.map((a) => <span key={a} className="tag tag-allergen">{a}</span>)}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button onClick={() => startEdit(d)} style={{ padding: "6px 12px", fontSize: 13 }}>
              Edit
            </button>
            <button
              onClick={() => toggleAvailable(d)}
              style={{ padding: "6px 12px", fontSize: 13, background: "#777" }}
            >
              {d.isAvailable ? "Hide" : "Show"}
            </button>
            <button
              onClick={() => remove(d)}
              style={{ padding: "6px 12px", fontSize: 13, background: "#b93a3a" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 