import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPublicFoodLists, getMyFoodLists, createFoodList,
  deleteFoodList, updateFoodList, getFoodListById,
  addItemToList, removeItemFromList,
} from "../api/community";
import { useAuth } from "../context/AuthContext";

export default function FoodLists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("public");
  const [lists, setLists] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  // Detail view
  const [viewList, setViewList] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Add item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemType, setItemType] = useState("dish");
  const [itemId, setItemId] = useState("");
  const [itemNote, setItemNote] = useState("");

  // Edit form
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPublic, setEditPublic] = useState(true);

  const load = () => {
    setLoading(true);
    const fetcher = tab === "mine" ? getMyFoodLists() : getPublicFoodLists(search || undefined);
    fetcher.then((d) => setLists(d.lists)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createFoodList({ title: title.trim(), description, isPublic });
      setTitle(""); setDescription(""); setIsPublic(true); setShowForm(false);
      load();
    } catch (err) { alert(err.response?.data?.message || "Could not create"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this list permanently?")) return;
    try { await deleteFoodList(id); setLists((p) => p.filter((l) => l.id !== id)); }
    catch (err) { alert(err.response?.data?.message || "Could not delete"); }
  };

  const openDetail = async (id) => {
    setViewLoading(true);
    try {
      const data = await getFoodListById(id);
      setViewList(data.list);
      setEditTitle(data.list.title);
      setEditDesc(data.list.description || "");
      setEditPublic(data.list.isPublic);
    } catch (err) { alert(err.response?.data?.message || "Could not load list"); }
    finally { setViewLoading(false); }
  };

  const handleSaveEdit = async () => {
    try {
      const data = await updateFoodList(viewList.id, { title: editTitle, description: editDesc, isPublic: editPublic });
      setViewList(data.list); setEditing(false); load();
    } catch (err) { alert(err.response?.data?.message || "Could not update"); }
  };

  const handleAddItem = async () => {
    if (!itemId.trim()) return;
    try {
      const payload = { itemType, note: itemNote };
      if (itemType === "dish") payload.dish = itemId.trim();
      else payload.restaurant = itemId.trim();
      const data = await addItemToList(viewList.id, payload);
      setViewList(data.list); setItemId(""); setItemNote(""); setShowAddItem(false);
    } catch (err) { alert(err.response?.data?.message || "Could not add item"); }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const data = await removeItemFromList(viewList.id, itemId);
      setViewList(data.list);
    } catch (err) { alert(err.response?.data?.message || "Could not remove"); }
  };

  const pill = (active) => ({
    padding: "6px 16px", borderRadius: 20,
    border: active ? "none" : "1px solid #ccc",
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#333",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
  });
  const btn = (bg = "#2563eb") => ({
    padding: "7px 16px", borderRadius: 8, border: "none",
    background: bg, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13,
  });

  // ── Detail View ──
  if (viewList) {
    const isOwner = user && viewList.owner?.id === user.id;
    return (
      <div style={{ padding: 24, maxWidth: 620, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
        <button onClick={() => { setViewList(null); setEditing(false); setShowAddItem(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#2563eb", fontWeight: 600, marginBottom: 12, padding: 0 }}>
          ← Back to Lists
        </button>

        {!editing ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h2 style={{ margin: "0 0 4px" }}>{viewList.title}</h2>
                <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
                  by {viewList.owner?.name || "Unknown"} · {viewList.isPublic ? "🌐 Public" : "🔒 Private"} · {viewList.itemCount} item{viewList.itemCount !== 1 ? "s" : ""}
                </p>
              </div>
              {isOwner && (
                <button onClick={() => setEditing(true)} style={btn("#6b7280")}>Edit</button>
              )}
            </div>
            {viewList.description && <p style={{ color: "#555", marginTop: 8 }}>{viewList.description}</p>}
          </>
        ) : (
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontFamily: "inherit" }} />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: "1px solid #ccc", resize: "vertical", fontFamily: "inherit", marginBottom: 8 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 8 }}>
              <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} /> Public list
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSaveEdit} style={btn()}>Save</button>
              <button onClick={() => setEditing(false)} style={{ ...btn("#6b7280") }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Items */}
        <h3 style={{ marginTop: 20, marginBottom: 10 }}>Items</h3>

        {isOwner && !showAddItem && (
          <button onClick={() => setShowAddItem(true)} style={{ ...btn(), marginBottom: 12 }}>+ Add Item</button>
        )}

        {showAddItem && (
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button onClick={() => setItemType("dish")} style={pill(itemType === "dish")}>Dish</button>
              <button onClick={() => setItemType("restaurant")} style={pill(itemType === "restaurant")}>Restaurant</button>
            </div>
            <input value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder={`Paste ${itemType} ID`} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontFamily: "inherit" }} />
            <input value={itemNote} onChange={(e) => setItemNote(e.target.value)} placeholder="Note (optional) — e.g. Best kacchi in Gulshan" style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleAddItem} style={btn()}>Add</button>
              <button onClick={() => setShowAddItem(false)} style={btn("#6b7280")}>Cancel</button>
            </div>
          </div>
        )}

        {viewList.items?.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No items in this list yet.</p>
        )}

        {viewList.items?.map((item) => (
          <div key={item.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: item.itemType === "dish" ? "#fefce8" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {item.itemType === "dish" ? "🍛" : "🏪"}
            </div>
            <div style={{ flex: 1 }}>
              <strong>
                {item.itemType === "dish"
                  ? (item.dish?.name || item.dish || "Dish")
                  : (item.restaurant?.businessName || item.restaurant || "Restaurant")}
              </strong>
              <span style={{ color: "#888", fontSize: 12, marginLeft: 6 }}>{item.itemType}</span>
              {item.note && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666", fontStyle: "italic" }}>"{item.note}"</p>}
            </div>
            {isOwner && (
              <button onClick={() => handleRemoveItem(item.id)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#ccc" }}>✕</button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── List View ──
  return (
    <div style={{ padding: 24, maxWidth: 620, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <button onClick={() => navigate("/app")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#2563eb", fontWeight: 600, marginBottom: 12, padding: 0 }}>
        ← Back to Dashboard
      </button>

      <h2 style={{ marginBottom: 4 }}>Food Lists</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
        Curated collections of dishes &amp; restaurants
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["public", "mine"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={pill(tab === t)}>
            {t === "public" ? "🌐 Browse Public" : "📋 My Lists"}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab === "public" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search lists… (e.g. biriyani, budget)" style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd", fontFamily: "inherit" }} />
          <button onClick={load} style={pill(true)}>Search</button>
        </div>
      )}

      {/* Create */}
      {tab === "mine" && user && (
        <div style={{ marginBottom: 16 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={btn()}>+ New List</button>
          ) : (
            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 16 }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="List title (e.g. Best Biriyanis in Dhaka)" style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontFamily: "inherit" }} />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" rows={2} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: "1px solid #ccc", resize: "vertical", fontFamily: "inherit", marginBottom: 8 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 10 }}>
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Make this list public
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCreate} disabled={creating} style={btn(creating ? "#9bbcf0" : "#2563eb")}>{creating ? "Creating…" : "Create"}</button>
                <button onClick={() => setShowForm(false)} style={btn("#6b7280")}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && <p style={{ color: "#888" }}>Loading…</p>}

      {!loading && lists.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, border: "2px dashed #e5e5e5", borderRadius: 12 }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {tab === "public" ? "No public lists found" : "You haven't created any lists yet"}
          </p>
          <p style={{ color: "#888" }}>
            {tab === "public" ? "Try a different search!" : "Create one to curate your favourite dishes & restaurants."}
          </p>
        </div>
      )}

      {/* List cards */}
      {lists.map((l) => (
        <div key={l.id} style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 10, background: "#fff", cursor: "pointer" }} onClick={() => openDetail(l.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <strong style={{ fontSize: 16 }}>{l.title}</strong>
              <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>
                {l.itemCount} item{l.itemCount !== 1 ? "s" : ""} · {l.isPublic ? "🌐" : "🔒"}
              </span>
              {l.owner && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>by {l.owner.name}</p>}
              {l.description && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#555" }}>{l.description}</p>}
            </div>
            {tab === "mine" && (
              <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#ccc" }}>✕</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 