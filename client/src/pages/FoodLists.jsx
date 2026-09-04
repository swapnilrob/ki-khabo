import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPublicFoodLists, getMyFoodLists, createFoodList,
  deleteFoodList, updateFoodList, getFoodListById,
  addItemToList, removeItemFromList,
} from "../api/community";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui";

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

  // Edit form
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPublic, setEditPublic] = useState(true);

  // Add item flow
  const [showAddItem, setShowAddItem] = useState(false);
  const [addStep, setAddStep] = useState("search"); // "search" | "pick-type" | "pick-dish"
  const [restSearch, setRestSearch] = useState("");
  const [restResults, setRestResults] = useState([]);
  const [restSearching, setRestSearching] = useState(false);
  const [selectedRest, setSelectedRest] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [itemNote, setItemNote] = useState("");

  const load = () => {
    setLoading(true);
    const fetcher = tab === "mine" ? getMyFoodLists() : getPublicFoodLists(search || undefined);
    fetcher.then((d) => setLists(d.lists)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleSearch = () => { load(); };

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

  // ── Add Item Flow ──
  const resetAddItem = () => {
    setShowAddItem(false);
    setAddStep("search");
    setRestSearch("");
    setRestResults([]);
    setSelectedRest(null);
    setDishes([]);
    setItemNote("");
  };

  const searchRestaurants = async () => {
    if (!restSearch.trim()) return;
    setRestSearching(true);
    try {
      const { data } = await api.get("/restaurants", { params: {} });
      const filtered = data.restaurants.filter((r) =>
        r.businessName.toLowerCase().includes(restSearch.toLowerCase())
      );
      setRestResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setRestSearching(false);
    }
  };

  const selectRestaurant = (rest) => {
    setSelectedRest(rest);
    setAddStep("pick-type");
  };

  const addRestaurantToList = async () => {
    try {
      const data = await addItemToList(viewList.id, {
        itemType: "restaurant",
        restaurant: selectedRest._id,
        note: itemNote,
      });
      setViewList(data.list);
      resetAddItem();
    } catch (err) { alert(err.response?.data?.message || "Could not add"); }
  };

  const loadDishes = async () => {
    setDishesLoading(true);
    setAddStep("pick-dish");
    try {
      const { data } = await api.get(`/dishes/restaurant/${selectedRest._id}`);
      setDishes(data.menu || []);
    } catch (err) {
      console.error(err);
      setDishes([]);
    } finally {
      setDishesLoading(false);
    }
  };

  const addDishToList = async (dishId) => {
    try {
      const data = await addItemToList(viewList.id, {
        itemType: "dish",
        dish: dishId,
        note: itemNote,
      });
      setViewList(data.list);
      resetAddItem();
    } catch (err) { alert(err.response?.data?.message || "Could not add"); }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const data = await removeItemFromList(viewList.id, itemId);
      setViewList(data.list);
    } catch (err) { alert(err.response?.data?.message || "Could not remove"); }
  };

  // ══════════════════════════════════════════
  // DETAIL VIEW
  // ══════════════════════════════════════════
  if (viewList) {
    const isOwner = user && viewList.owner?.id === user.id;
    return (
      <AppLayout>
        <button onClick={() => { setViewList(null); setEditing(false); resetAddItem(); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--kk-orange)", fontWeight: 600, marginBottom: 16, padding: 0 }}>
          ← Back to lists
        </button>

        {viewLoading ? <p style={{ color: "var(--kk-text-muted)" }}>Loading...</p> : (
          <>
            {/* Header */}
            {!editing ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <h2 className="kk-page-title" style={{ margin: 0 }}>{viewList.title}</h2>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 4,
                    background: viewList.isPublic ? "var(--kk-green-light)" : "var(--kk-bg)",
                    color: viewList.isPublic ? "var(--kk-green)" : "var(--kk-text-muted)",
                  }}>
                    {viewList.isPublic ? "PUBLIC" : "PRIVATE"}
                  </span>
                </div>
                {viewList.description && <p style={{ color: "var(--kk-text-secondary)", fontSize: 14 }}>{viewList.description}</p>}
                <p style={{ fontSize: 12, color: "var(--kk-text-muted)", marginTop: 4 }}>
                  By {viewList.owner?.name || "Unknown"} · {viewList.items?.length || 0} item{viewList.items?.length !== 1 ? "s" : ""}
                </p>
                {isOwner && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="kk-btn kk-btn--outline kk-btn--sm" onClick={() => setEditing(true)}>Edit</button>
                    <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => { setShowAddItem(true); setAddStep("search"); }}>Add item</button>
                  </div>
                )}
              </div>
            ) : (
              <Card style={{ marginBottom: 20, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Edit list</h3>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--kk-text-secondary)", display: "block", marginBottom: 4 }}>Title</label>
                  <input className="kk-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--kk-text-secondary)", display: "block", marginBottom: 4 }}>Description</label>
                  <textarea className="kk-input" rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12 }}>
                  <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} />
                  Public (visible to all users)
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={handleSaveEdit}>Save</button>
                  <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </Card>
            )}

            {/* ── Add Item Modal ── */}
            {showAddItem && (
              <Card style={{ marginBottom: 20, padding: 20, border: "2px solid var(--kk-orange-light)" }}>

                {/* Step 1: Search restaurants */}
                {addStep === "search" && (
                  <>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Search for a restaurant</h3>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <input
                        className="kk-input"
                        placeholder="Type restaurant name..."
                        value={restSearch}
                        onChange={(e) => setRestSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchRestaurants()}
                      />
                      <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={searchRestaurants} disabled={restSearching}>
                        {restSearching ? "Searching..." : "Search"}
                      </button>
                    </div>

                    {restResults.length > 0 && (
                      <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {restResults.map((r) => (
                          <button
                            key={r._id}
                            onClick={() => selectRestaurant(r)}
                            style={{
                              display: "block", width: "100%", textAlign: "left",
                              padding: "10px 12px", border: "none", borderBottom: "1px solid var(--kk-border-light)",
                              background: "transparent", cursor: "pointer", fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => e.target.style.background = "var(--kk-bg)"}
                            onMouseLeave={(e) => e.target.style.background = "transparent"}
                          >
                            <strong style={{ fontSize: 14 }}>{r.businessName}</strong>
                            <span style={{ color: "var(--kk-text-muted)", fontSize: 12, marginLeft: 8 }}>
                              {r.city} · {r.cuisineTypes?.join(", ") || ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {restResults.length === 0 && restSearch && !restSearching && (
                      <p style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>No restaurants found. Try a different name.</p>
                    )}

                    <button className="kk-btn kk-btn--ghost kk-btn--sm" style={{ marginTop: 8 }} onClick={resetAddItem}>Cancel</button>
                  </>
                )}

                {/* Step 2: Choose — add restaurant or pick a dish */}
                {addStep === "pick-type" && selectedRest && (
                  <>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{selectedRest.businessName}</h3>
                    <p style={{ fontSize: 13, color: "var(--kk-text-muted)", marginBottom: 12 }}>
                      {selectedRest.city} · {selectedRest.cuisineTypes?.join(", ")}
                    </p>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--kk-text-secondary)", display: "block", marginBottom: 4 }}>Note (optional)</label>
                      <input className="kk-input" placeholder="e.g. Best biryani in town" value={itemNote} onChange={(e) => setItemNote(e.target.value)} />
                    </div>

                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--kk-text-secondary)", marginBottom: 10 }}>What would you like to add?</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={addRestaurantToList}>
                        Add this restaurant
                      </button>
                      <button className="kk-btn kk-btn--outline kk-btn--sm" onClick={loadDishes}>
                        Pick a dish from menu
                      </button>
                      <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => { setAddStep("search"); setSelectedRest(null); }}>
                        Back
                      </button>
                    </div>
                  </>
                )}

                {/* Step 3: Pick a dish from the restaurant */}
                {addStep === "pick-dish" && selectedRest && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                        Pick a dish from {selectedRest.businessName}
                      </h3>
                      <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setAddStep("pick-type")}>Back</button>
                    </div>

                    {dishesLoading ? (
                      <p style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>Loading menu...</p>
                    ) : dishes.length === 0 ? (
                      <p style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>No dishes found for this restaurant.</p>
                    ) : (
                      <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        {dishes.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => addDishToList(d.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              width: "100%", textAlign: "left",
                              padding: "10px 12px", border: "none", borderBottom: "1px solid var(--kk-border-light)",
                              background: "transparent", cursor: "pointer", fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--kk-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ fontSize: 22 }}>🍽️</span>
                            <div>
                              <strong style={{ fontSize: 14 }}>{d.name}</strong>
                              {d.price != null && (
                                <span style={{ color: "var(--kk-orange)", fontWeight: 600, marginLeft: 8 }}>৳{d.price}</span>
                              )}
                              {d.description && (
                                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--kk-text-muted)" }}>
                                  {d.description.length > 60 ? d.description.slice(0, 60) + "..." : d.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}

            {/* ── Items ── */}
            {(!viewList.items || viewList.items.length === 0) ? (
              <Card style={{ textAlign: "center", padding: "40px 24px", color: "var(--kk-text-muted)" }}>
                This list is empty.{isOwner ? " Tap 'Add item' to get started." : ""}
              </Card>
            ) : viewList.items.map((item) => (
              <Card key={item.id} style={{ marginBottom: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--kk-orange-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {item.itemType === "dish" ? "🍛" : "🏪"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14 }}>
                      {item.itemType === "dish"
                        ? (item.dish?.name || "Dish")
                        : (item.restaurant?.businessName || "Restaurant")}
                    </strong>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, marginLeft: 8,
                      background: item.itemType === "dish" ? "var(--kk-orange-light)" : "var(--kk-blue-light)",
                      color: item.itemType === "dish" ? "var(--kk-orange)" : "var(--kk-blue)",
                    }}>
                      {item.itemType.toUpperCase()}
                    </span>
                    {item.note && (
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--kk-text-muted)", fontStyle: "italic" }}>
                        "{item.note}"
                      </p>
                    )}
                  </div>
                  {isOwner && (
                    <button onClick={() => handleRemoveItem(item.id)} title="Remove"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--kk-text-muted)", padding: 4 }}>
                      ✕
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </>
        )}
      </AppLayout>
    );
  }

  // ══════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════
  return (
    <AppLayout>
      <h2 className="kk-page-title">Food Lists</h2>
      <p className="kk-page-subtitle">Curated community food guides</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className={`kk-btn kk-btn--sm ${tab === "public" ? "kk-btn--primary" : "kk-btn--outline"}`}
          onClick={() => setTab("public")}>
          Public lists
        </button>
        {user && (
          <button className={`kk-btn kk-btn--sm ${tab === "mine" ? "kk-btn--primary" : "kk-btn--outline"}`}
            onClick={() => setTab("mine")}>
            My lists
          </button>
        )}
      </div>

      {/* Search (public tab) */}
      {tab === "public" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input className="kk-input" placeholder="Search lists..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ maxWidth: 300 }} />
          <button className="kk-btn kk-btn--secondary kk-btn--sm" onClick={handleSearch}>Search</button>
        </div>
      )}

      {/* Create button */}
      {user && (
        <div style={{ marginBottom: 20 }}>
          {!showForm ? (
            <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => setShowForm(true)}>
              + Create new list
            </button>
          ) : (
            <Card style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Create a food list</h3>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--kk-text-secondary)", display: "block", marginBottom: 4 }}>Title</label>
                <input className="kk-input" placeholder="e.g. Best Biryanis in Dhaka" value={title}
                  onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--kk-text-secondary)", display: "block", marginBottom: 4 }}>Description</label>
                <textarea className="kk-input" rows={2} placeholder="What is this list about?" value={description}
                  onChange={(e) => setDescription(e.target.value)} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14 }}>
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Public (anyone can see this list)
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={handleCreate} disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </button>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* List of lists */}
      {loading ? (
        <p style={{ color: "var(--kk-text-muted)" }}>Loading...</p>
      ) : lists.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px 24px", color: "var(--kk-text-muted)" }}>
          {tab === "mine" ? "You haven't created any lists yet." : "No public lists found."}
        </Card>
      ) : (
        lists.map((list) => (
          <Card key={list.id} hover style={{ marginBottom: 10, padding: 16, cursor: "pointer" }}
            onClick={() => openDetail(list.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{list.title}</h3>
                <p style={{ fontSize: 12, color: "var(--kk-text-muted)", margin: 0 }}>
                  By {list.owner?.name || "Unknown"} · {list.itemCount ?? 0} items
                </p>
                {list.description && (
                  <p style={{ fontSize: 13, color: "var(--kk-text-secondary)", marginTop: 4 }}>
                    {list.description.length > 80 ? list.description.slice(0, 80) + "..." : list.description}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 4,
                  background: list.isPublic ? "var(--kk-green-light)" : "var(--kk-bg)",
                  color: list.isPublic ? "var(--kk-green)" : "var(--kk-text-muted)",
                }}>
                  {list.isPublic ? "PUBLIC" : "PRIVATE"}
                </span>
                {user && list.owner?.id === user.id && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(list.id); }}
                    className="kk-btn kk-btn--ghost kk-btn--sm" style={{ padding: "2px 8px", fontSize: 14, color: "var(--kk-red)" }}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </AppLayout>
  );
}