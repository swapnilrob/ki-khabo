import { useEffect, useState } from "react";
import {
  getPublicFoodLists,
  getMyFoodLists,
  createFoodList,
  deleteFoodList,
} from "../api/community";
import { useAuth } from "../context/AuthContext";

export default function FoodLists() {
  const { user } = useAuth();
  const [tab, setTab] = useState("public"); // "public" | "mine"
  const [lists, setLists] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New list form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    const fetcher =
      tab === "mine"
        ? getMyFoodLists()
        : getPublicFoodLists(search || undefined);
    fetcher
      .then((data) => setLists(data.lists))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createFoodList({ title: title.trim(), description, isPublic: true });
      setTitle("");
      setDescription("");
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not create list");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this list?")) return;
    try {
      await deleteFoodList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h2>Food Lists</h2>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["public", "mine"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: tab === t ? "none" : "1px solid #ccc",
              background: tab === t ? "#2563eb" : "#fff",
              color: tab === t ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t === "public" ? "Browse Public" : "My Lists"}
          </button>
        ))}
      </div>

      {/* Search (public tab only) */}
      {tab === "public" && (
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lists… (e.g. biriyani)"
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Search
          </button>
        </form>
      )}

      {/* Create button (my lists tab) */}
      {tab === "mine" && user && (
        <div style={{ marginBottom: 16 }}>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              + New List
            </button>
          ) : (
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="List title (e.g. Best Biriyanis in Dhaka)"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  marginBottom: 8,
                  fontFamily: "inherit",
                }}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (optional)"
                rows={2}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: creating ? "#9bbcf0" : "#2563eb",
                    color: "#fff",
                    cursor: creating ? "default" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List cards */}
      {loading && <p style={{ color: "#888" }}>Loading…</p>}

      {!loading && lists.length === 0 && (
        <p style={{ color: "#888" }}>
          {tab === "public"
            ? "No public lists found. Try a different search!"
            : "You haven't created any lists yet."}
        </p>
      )}

      {lists.map((l) => (
        <div
          key={l.id}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 10,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <strong style={{ fontSize: 16 }}>{l.title}</strong>
              <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>
                {l.itemCount} item{l.itemCount !== 1 ? "s" : ""}
              </span>
              {l.owner && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
                  by {l.owner.name}
                </p>
              )}
              {l.description && (
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#555" }}>
                  {l.description}
                </p>
              )}
            </div>
            {tab === "mine" && (
              <button
                onClick={() => handleDelete(l.id)}
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
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 