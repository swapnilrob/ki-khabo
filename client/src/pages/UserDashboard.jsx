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
      <p style={{ marginTop: 8 }}>
        <Link to="/app/health">📊 View my Health Dashboard</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to="/discover">🔍 Discover &amp; search restaurants</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to="/app/meal-planner">📅 Plan my meals</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to="/app/recommendations">Recommended for you →</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to="/feed">📰 My Feed</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to="/saved-dishes">💾 Saved Dishes</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to="/food-lists">📋 Food Lists</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to="/reviews-demo">⭐ Reviews</Link>
      </p>
    </div>
  );
}