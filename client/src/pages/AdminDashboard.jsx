import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { logout } = useAuth();
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

  useEffect(() => {
    load();
  }, []);

  const decide = async (id, status) => {
    const rejectionReason =
      status === "rejected" ? window.prompt("Reason for rejection:") || "" : "";
    await api.patch(`/admin/restaurants/${id}/status`, { status, rejectionReason });
    setMsg(`Restaurant ${status}.`);
    load();
  };

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Admin Dashboard</h2>
        <button onClick={logout}>Log out</button>
      </header>

      {msg && <p style={{ marginTop: 12, color: "#2e7d32" }}>{msg}</p>}

      {stats && (
        <div className="stat-grid">
          <div>Users: {stats.totalUsers}</div>
          <div>Owners: {stats.totalOwners}</div>
          <div>Pending: {stats.pendingRestaurants}</div>
          <div>Approved: {stats.approvedRestaurants}</div>
        </div>
      )}

      <h3 style={{ marginTop: 16 }}>Pending applications ({pending.length})</h3>
      {pending.length === 0 && <p>No pending applications.</p>}

      {pending.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Business</th><th>Owner</th><th>Trade License</th><th>City</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r._id}>
                <td>{r.businessName}</td>
                <td>{r.owner?.name}<br /><small>{r.owner?.email}</small></td>
                <td>{r.tradeLicenseNo}</td>
                <td>{r.city}</td>
                <td>
                  <button onClick={() => decide(r._id, "approved")}>Approve</button>
                  <button
                    onClick={() => decide(r._id, "rejected")}
                    style={{ background: "#777" }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}