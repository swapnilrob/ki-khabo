import { useEffect, useState } from "react";
import { getMySavedDishes, getMyCollections, unsaveDish } from "../api/community";

export default function SavedDishes() {
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load collection tabs on mount
  useEffect(() => {
    getMyCollections()
      .then((data) => setCollections(data.collections))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load dishes when a collection tab is clicked (or on mount for all)
  useEffect(() => {
    setLoading(true);
    getMySavedDishes(activeCollection)
      .then((data) => setDishes(data.saved))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCollection]);

  const handleUnsave = async (id) => {
    try {
      await unsaveDish(id);
      setDishes((prev) => prev.filter((d) => d.id !== id));
      // Refresh collection counts
      getMyCollections().then((data) => setCollections(data.collections));
    } catch (err) {
      console.error(err.response?.data?.message || "Could not remove");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h2>My Saved Dishes</h2>

      {/* Collection tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          onClick={() => setActiveCollection(null)}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: activeCollection === null ? "none" : "1px solid #ccc",
            background: activeCollection === null ? "#2563eb" : "#fff",
            color: activeCollection === null ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          All
        </button>
        {collections.map((c) => (
          <button
            key={c.collectionName}
            onClick={() => setActiveCollection(c.collectionName)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: activeCollection === c.collectionName ? "none" : "1px solid #ccc",
              background: activeCollection === c.collectionName ? "#2563eb" : "#fff",
              color: activeCollection === c.collectionName ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {c.collectionName} ({c.count})
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "#888" }}>Loading…</p>}

      {!loading && dishes.length === 0 && (
        <p style={{ color: "#888" }}>No saved dishes yet. Browse restaurants and save your favourites!</p>
      )}

      {dishes.map((s) => (
        <div
          key={s.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid #e5e5e5",
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <div>
            <strong>{s.dish?.name || "Unknown dish"}</strong>
            {s.dish?.price != null && (
              <span style={{ color: "#888", fontSize: 13, marginLeft: 6 }}>৳{s.dish.price}</span>
            )}
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
              in: {s.collectionName}
            </p>
          </div>
          <button
            onClick={() => handleUnsave(s.id)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid #e5e5e5",
              background: "#fff",
              color: "#c0392b",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
} 