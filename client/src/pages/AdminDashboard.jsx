import { useEffect, useState } from "react";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";
import { Card, Badge } from "../components/ui";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [s, r] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/restaurants?status=pending"),
    ]);
    setStats(s.data.stats);
    setPending(r.data.restaurants);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id, status) => {
    const rejectionReason =
      status === "rejected" ? window.prompt("Reason for rejection:") || "" : "";
    await api.patch(`/admin/restaurants/${id}/status`, { status, rejectionReason });
    setMsg(`Restaurant ${status}.`);
    setTimeout(() => setMsg(""), 3000);
    load();
  };

  return (
    <AppLayout>
      <h2 className="kk-page-title">Admin Dashboard</h2>
      <p className="kk-page-subtitle">Platform overview and management</p>

      {msg && <div className="kk-toast">{msg}</div>}

      {/* ── Stats ── */}
      {stats && (
        <div className="kk-stat-grid">
          <Card className="kk-stat-card">
            <span className="kk-stat-card__val">{stats.totalUsers}</span>
            <span className="kk-stat-card__label">Users</span>
          </Card>
          <Card className="kk-stat-card">
            <span className="kk-stat-card__val">{stats.totalOwners}</span>
            <span className="kk-stat-card__label">Owners</span>
          </Card>
          <Card className="kk-stat-card">
            <span className="kk-stat-card__val">{stats.premiumSubscribers}</span>
            <span className="kk-stat-card__label">Premium</span>
          </Card>
          <Card className="kk-stat-card">
            <span className="kk-stat-card__val kk-stat-card__val--pending">{stats.pendingRestaurants}</span>
            <span className="kk-stat-card__label">Pending</span>
          </Card>
          <Card className="kk-stat-card">
            <span className="kk-stat-card__val kk-stat-card__val--approved">{stats.approvedRestaurants}</span>
            <span className="kk-stat-card__label">Approved</span>
          </Card>
        </div>
      )}

      {/* ── Pending queue ── */}
      <h3 className="kk-section-title">
        Pending applications
        <Badge variant="neutral">{pending.length}</Badge>
      </h3>

      {pending.length === 0 ? (
        <Card className="kk-empty">No pending applications right now.</Card>
      ) : (
        <div className="kk-table-wrap">
          <table className="kk-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Trade License</th>
                <th>City</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r._id}>
                  <td className="kk-table__primary">{r.businessName}</td>
                  <td>
                    {r.owner?.name}
                    <br />
                    <span className="kk-table__small">{r.owner?.email}</span>
                  </td>
                  <td>
                    <code className="kk-table__code">{r.tradeLicenseNo}</code>
                  </td>
                  <td>{r.city}</td>
                  <td className="kk-table__actions">
                    <button
                      className="kk-btn kk-btn--primary kk-btn--sm"
                      onClick={() => decide(r._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="kk-btn kk-btn--danger kk-btn--sm"
                      onClick={() => decide(r._id, "rejected")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
