import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Welcome, {user?.name} 👋</h2>
        <button onClick={logout}>Log out</button>
      </header>
      <p style={{ marginTop: 16 }}>Your food-seeker modules will load here.</p>
      <p style={{ marginTop: 8 }}>
        <Link to="/app/preferences">🍽️ Edit profile &amp; dietary preferences</Link>
      </p>
    </div>
  );
}