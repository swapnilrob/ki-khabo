import { useEffect, useState } from "react";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";
import { Card, Badge } from "../components/ui";
import "./AdminDashboard.css";

const TABS = [
  { key: "overview",     label: "Overview" },
  { key: "restaurants",  label: "Restaurants" },
  { key: "users",        label: "Users" },
  { key: "reviews",      label: "Reviews" },
  { key: "nutrition",    label: "Nutrition" },
  { key: "settings",     label: "Settings" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState("");

  // restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [restStatus, setRestStatus] = useState("pending");

  // users
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState("");

  // reviews
  const [reviews, setReviews] = useState([]);
  const [onlyFlagged, setOnlyFlagged] = useState(true);

  // nutrition
  const [dishes, setDishes] = useState([]);

  // settings
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    monthlyPrice: "",
    yearlyPrice: "",
    pointsPerTaka: "",
  });

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  // ── Loaders ──
  const loadStats = () => api.get("/admin/stats").then((r) => setStats(r.data.stats));

  const loadRestaurants = () =>
    api.get("/admin/restaurants", { params: restStatus ? { status: restStatus } : {} })
      .then((r) => setRestaurants(r.data.restaurants));

  const loadUsers = () =>
    api.get("/admin/users", { params: userRole ? { role: userRole } : {} })
      .then((r) => setUsers(r.data.users));

  const loadReviews = () =>
    api.get("/admin/reviews", { params: onlyFlagged ? { flagged: "true" } : {} })
      .then((r) => setReviews(r.data.reviews));

  const loadDishes = () =>
    api.get("/admin/dishes", { params: { verified: "false" } })
      .then((r) => setDishes(r.data.dishes));

  const loadSettings = () =>
    api.get("/admin/settings").then((r) => {
      setSettings(r.data.settings);
      setSettingsForm({
        monthlyPrice: r.data.settings.monthlyPrice,
        yearlyPrice: r.data.settings.yearlyPrice,
        pointsPerTaka: r.data.settings.pointsPerTaka,
      });
    });

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === "restaurants") loadRestaurants(); }, [tab, restStatus]);
  useEffect(() => { if (tab === "users") loadUsers(); }, [tab, userRole]);
  useEffect(() => { if (tab === "reviews") loadReviews(); }, [tab, onlyFlagged]);
  useEffect(() => { if (tab === "nutrition") loadDishes(); }, [tab]);
  useEffect(() => { if (tab === "settings") loadSettings(); }, [tab]);

  // ── Actions ──
  const decideRestaurant = async (id, status) => {
    const rejectionReason = status === "rejected" ? window.prompt("Reason for rejection:") || "" : "";
    await api.patch(`/admin/restaurants/${id}/status`, { status, rejectionReason });
    flash(`Restaurant ${status}`);
    loadRestaurants();
    loadStats();
  };

  const toggleRestaurant = async (id) => {
    await api.patch(`/admin/restaurants/${id}/toggle-active`);
    flash("Restaurant toggled");
    loadRestaurants();
  };

  const toggleUser = async (id) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    flash("User toggled");
    loadUsers();
  };

  const removeReview = async (id) => {
    if (!window.confirm("Remove this review permanently?")) return;
    await api.delete(`/admin/reviews/${id}`);
    flash("Review removed");
    loadReviews();
  };

  const approveReview = async (id) => {
    await api.patch(`/admin/reviews/${id}/unflag`);
    flash("Review approved");
    loadReviews();
  };

  const verifyDish = async (id, verified) => {
    await api.patch(`/admin/dishes/${id}/verify`, { verified });
    flash(verified ? "Nutrition verified" : "Verification removed");
    loadDishes();
  };

  const saveSettings = async () => {
    await api.put("/admin/settings", {
      monthlyPrice: Number(settingsForm.monthlyPrice),
      yearlyPrice: Number(settingsForm.yearlyPrice),
      pointsPerTaka: Number(settingsForm.pointsPerTaka),
    });
    flash("Settings saved");
    loadSettings();
  };

  return (
    <AppLayout>
      <h2 className="kk-page-title">Admin Dashboard</h2>
      <p className="kk-page-subtitle">Platform overview and management</p>

      {msg && <div className="kk-toast">{msg}</div>}

      {/* ── Tab bar ── */}
      <div className="kk-admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`kk-admin-tab ${tab === t.key ? "kk-admin-tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ OVERVIEW ════════ */}
      {tab === "overview" && stats && (
        <div className="kk-stat-grid">
          <Card className="kk-stat-card"><span className="kk-stat-card__val">{stats.totalUsers}</span><span className="kk-stat-card__label">Users</span></Card>
          <Card className="kk-stat-card"><span className="kk-stat-card__val">{stats.totalOwners}</span><span className="kk-stat-card__label">Owners</span></Card>
          <Card className="kk-stat-card"><span className="kk-stat-card__val">{stats.premiumSubscribers}</span><span className="kk-stat-card__label">Premium</span></Card>
          <Card className="kk-stat-card"><span className="kk-stat-card__val kk-stat-card__val--pending">{stats.pendingRestaurants}</span><span className="kk-stat-card__label">Pending</span></Card>
          <Card className="kk-stat-card"><span className="kk-stat-card__val kk-stat-card__val--approved">{stats.approvedRestaurants}</span><span className="kk-stat-card__label">Approved</span></Card>
          <Card className="kk-stat-card"><span className="kk-stat-card__val">{stats.rejectedRestaurants}</span><span className="kk-stat-card__label">Rejected</span></Card>
        </div>
      )}

      {/* ════════ RESTAURANTS ════════ */}
      {tab === "restaurants" && (
        <>
          <div className="kk-admin-filters">
            {["pending", "approved", "rejected", ""].map((s) => (
              <button key={s} className={`kk-btn kk-btn--sm ${restStatus === s ? "kk-btn--primary" : "kk-btn--secondary"}`} onClick={() => setRestStatus(s)}>
                {s || "All"}
              </button>
            ))}
          </div>

          {restaurants.length === 0 ? (
            <Card className="kk-empty">No restaurants found.</Card>
          ) : (
            <div className="kk-table-wrap">
              <table className="kk-table">
                <thead><tr><th>Business</th><th>Owner</th><th>City</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {restaurants.map((r) => (
                    <tr key={r._id}>
                      <td className="kk-table__primary">{r.businessName}</td>
                      <td>{r.owner?.name}<br /><span className="kk-table__small">{r.owner?.email}</span></td>
                      <td>{r.city}</td>
                      <td><Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "neutral"}>{r.status}</Badge></td>
                      <td className="kk-table__actions">
                        {r.status === "pending" && (
                          <>
                            <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => decideRestaurant(r._id, "approved")}>Approve</button>
                            <button className="kk-btn kk-btn--danger kk-btn--sm" onClick={() => decideRestaurant(r._id, "rejected")}>Reject</button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <button className="kk-btn kk-btn--sm kk-btn--danger" onClick={() => toggleRestaurant(r._id)}>
                            {r.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════ USERS ════════ */}
      {tab === "users" && (
        <>
          <div className="kk-admin-filters">
            {["", "user", "owner"].map((r) => (
              <button key={r} className={`kk-btn kk-btn--sm ${userRole === r ? "kk-btn--primary" : "kk-btn--secondary"}`} onClick={() => setUserRole(r)}>
                {r || "All"}
              </button>
            ))}
          </div>

          {users.length === 0 ? (
            <Card className="kk-empty">No users found.</Card>
          ) : (
            <div className="kk-table-wrap">
              <table className="kk-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Premium</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="kk-table__primary">{u.name}</td>
                      <td><span className="kk-table__small">{u.email}</span></td>
                      <td><Badge variant={u.role === "owner" ? "info" : "default"}>{u.role}</Badge></td>
                      <td>{u.isPremium ? <Badge variant="info">Premium</Badge> : "—"}</td>
                      <td>{u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
                      <td className="kk-table__actions">
                        {u.role !== "admin" && (
                          <button className={`kk-btn kk-btn--sm ${u.isActive ? "kk-btn--danger" : "kk-btn--primary"}`} onClick={() => toggleUser(u._id)}>
                            {u.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════ REVIEWS ════════ */}
      {tab === "reviews" && (
        <>
          <div className="kk-admin-filters">
            <button className={`kk-btn kk-btn--sm ${onlyFlagged ? "kk-btn--primary" : "kk-btn--secondary"}`} onClick={() => setOnlyFlagged(true)}>Flagged only</button>
            <button className={`kk-btn kk-btn--sm ${!onlyFlagged ? "kk-btn--primary" : "kk-btn--secondary"}`} onClick={() => setOnlyFlagged(false)}>All reviews</button>
          </div>

          {reviews.length === 0 ? (
            <Card className="kk-empty">{onlyFlagged ? "No flagged reviews." : "No reviews yet."}</Card>
          ) : (
            reviews.map((rv) => (
              <Card key={rv._id} className="kk-admin-review">
                <div className="kk-admin-review__header">
                  <div>
                    <span className="kk-admin-review__user">{rv.user?.name || "Unknown"}</span>
                    <span className="kk-admin-review__meta"> on {rv.restaurant?.businessName || "—"}{rv.dish ? ` · ${rv.dish.name}` : ""}</span>
                  </div>
                  <div className="kk-admin-review__badges">
                    <Badge variant={rv.flagged ? "danger" : "success"}>{rv.flagged ? "Flagged" : "OK"}</Badge>
                    <Badge variant="neutral">{"★".repeat(rv.rating)}</Badge>
                  </div>
                </div>
                <p className="kk-admin-review__comment">{rv.comment || "(no comment)"}</p>
                {rv.flagged && rv.flagReason && (
                  <p className="kk-admin-review__reason">Flag reason: {rv.flagReason}</p>
                )}
                <div className="kk-table__actions" style={{ marginTop: "var(--kk-space-3)" }}>
                  {rv.flagged && (
                    <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => approveReview(rv._id)}>Approve</button>
                  )}
                  <button className="kk-btn kk-btn--danger kk-btn--sm" onClick={() => removeReview(rv._id)}>Remove</button>
                </div>
              </Card>
            ))
          )}
        </>
      )}

      {/* ════════ NUTRITION ════════ */}
      {tab === "nutrition" && (
        <>
          <h3 className="kk-section-title">Unverified nutritional data <Badge variant="neutral">{dishes.length}</Badge></h3>

          {dishes.length === 0 ? (
            <Card className="kk-empty">All nutritional data has been verified.</Card>
          ) : (
            <div className="kk-table-wrap">
              <table className="kk-table">
                <thead><tr><th>Dish</th><th>Restaurant</th><th>Cal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Actions</th></tr></thead>
                <tbody>
                  {dishes.map((d) => (
                    <tr key={d._id}>
                      <td className="kk-table__primary">{d.name}</td>
                      <td>{d.restaurant?.businessName || "—"}</td>
                      <td>{d.nutrition?.calories || 0}</td>
                      <td>{d.nutrition?.protein || 0}g</td>
                      <td>{d.nutrition?.carbohydrates || 0}g</td>
                      <td>{d.nutrition?.fat || 0}g</td>
                      <td className="kk-table__actions">
                        <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => verifyDish(d._id, true)}>Verify</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════ SETTINGS ════════ */}
      {tab === "settings" && settings && (
        <Card className="kk-admin-settings">
          <h3 className="kk-section-title">Platform Settings</h3>
          <div className="kk-admin-settings__grid">
            <div className="kk-input-group">
              <label>Monthly subscription price (BDT)</label>
              <input className="kk-input" type="number" value={settingsForm.monthlyPrice} onChange={(e) => setSettingsForm({ ...settingsForm, monthlyPrice: e.target.value })} />
            </div>
            <div className="kk-input-group">
              <label>Yearly subscription price (BDT)</label>
              <input className="kk-input" type="number" value={settingsForm.yearlyPrice} onChange={(e) => setSettingsForm({ ...settingsForm, yearlyPrice: e.target.value })} />
            </div>
            <div className="kk-input-group">
              <label>Points per taka (reward conversion)</label>
              <input className="kk-input" type="number" value={settingsForm.pointsPerTaka} onChange={(e) => setSettingsForm({ ...settingsForm, pointsPerTaka: e.target.value })} />
            </div>
          </div>
          <p className="kk-admin-settings__hint">
            Current reward rate: {settingsForm.pointsPerTaka ? `${Number(settingsForm.pointsPerTaka) * 50} points = ৳50 discount` : "—"}
          </p>
          <button className="kk-btn kk-btn--primary" onClick={saveSettings}>Save settings</button>
        </Card>
      )}
    </AppLayout>
  );
}