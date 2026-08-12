import { useAuth } from "../context/AuthContext";

export default function OwnerDashboard() {
  const { user, restaurant, logout } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{restaurant?.businessName || "Owner Dashboard"}</h2>
        <button onClick={logout}>Log out</button>
      </header>

      {restaurant?.status === "pending" && (
        <p className="error" style={{ marginTop: 16, background: "#fff4e0", color: "#8a6d3b" }}>
          ⏳ Your restaurant is awaiting admin verification.
        </p>
      )}
      {restaurant?.status === "rejected" && (
        <p className="error" style={{ marginTop: 16 }}>
          ❌ Rejected: {restaurant.rejectionReason}
        </p>
      )}
      {restaurant?.status === "approved" && (
        <p style={{ marginTop: 16, color: "#2e7d32", fontWeight: 600 }}>
          ✅ Your restaurant is live and visible to users.
        </p>
      )}

      <p style={{ marginTop: 16 }}>Menu &amp; analytics modules will load here.</p>
    </div>
  );
}