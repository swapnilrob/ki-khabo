import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySavedDishes, getMyCollections, unsaveDish } from "../api/community";

export default function SavedDishes() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCollections = () =>
    getMyCollections().then((d) => setCollections(d.collections)).catch(() => {});

  const loadDishes = (col) => {
    setLoading(true);
    getMySavedDishes(col)
      .then((d) => setDishes(d.saved))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCollections();
    loadDishes(null);
  }, []);

  const handleTabClick = (col) => {
    setActiveCollection(col);
    loadDishes(col);
  };

  const handleUnsave = async (id) => {
    try {
      await unsaveDish(id);
      setDishes((prev) => prev.filter((d) => d.id !== id));
      loadCollections();
    } catch (err) {
      alert(err.response?.data?.message || "Could not remove");
    }
  };

  const pill = (active) => ({
    padding: "6px 14px", borderRadius: 20,
    border: active ? "none" : "1px solid #ccc",
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#333",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
  });

  return (
    <div style={{ padding: 24, maxWidth: 620, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      {/* Back */}
      <button onClick={() => navigate("/app")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#2563eb", fontWeight: 600, marginBottom: 12, padding: 0 }}>
        ← Back to Dashboard
      </button>

      <h2 style={{ marginBottom: 4 }}>My Saved Dishes</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
        Dishes you've bookmarked — organised into collections
      </p>

      {/* Collection tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => handleTabClick(null)} style={pill(activeCollection === null)}>
          All ({dishes.length || 0})
        </button>
        {collections.map((c) => (
          <button key={c.collectionName} onClick={() => handleTabClick(c.collectionName)} style={pill(activeCollection === c.collectionName)}>
            {c.collectionName} ({c.count})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!loading && dishes.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, border: "2px dashed #e5e5e5", borderRadius: 12 }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>💾</p>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No saved dishes yet</p>
          <p style={{ color: "#888", marginBottom: 16 }}>
            Browse restaurants and save dishes you'd like to try later.
          </p>
          <button onClick={() => navigate("/restaurants")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Browse Restaurants
          </button>
        </div>
      )}

      {loading && <p style={{ color: "#888" }}>Loading…</p>}

      {/* Dish cards */}
      {dishes.map((s) => (
        <div key={s.id} style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 10, background: "#fff", display: "flex", gap: 14 }}>
          {/* Thumbnail placeholder */}
          <div style={{ width: 64, height: 64, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {s.dish?.imageUrl
              ? <img src={s.dish.imageUrl} alt={s.dish?.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover" }} />
              : "🍽️"}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <strong style={{ fontSize: 16 }}>{s.dish?.name || "Unknown dish"}</strong>
                {s.dish?.price != null && (
                  <span style={{ color: "#2563eb", fontWeight: 600, marginLeft: 8 }}>৳{s.dish.price}</span>
                )}
              </div>
              <button onClick={() => handleUnsave(s.id)} title="Remove from saved" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#ccc" }}>
                ✕
              </button>
            </div>

            <p style={{ margin: "4px 0", fontSize: 13, color: "#888" }}>
              📁 {s.collectionName}
            </p>

            {/* Restaurant link */}
            {s.dish?.restaurant && (
              <button
                onClick={() => navigate(`/restaurant/${s.dish.restaurant}`)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: 13, padding: 0, marginTop: 4, fontWeight: 600 }}
              >
                View restaurant →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 