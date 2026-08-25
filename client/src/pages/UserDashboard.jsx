import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card, Badge } from "../components/ui";
import "./UserDashboard.css";

const FEATURES = [
  { to: "/app/preferences",    icon: "⚙️", label: "Profile & Preferences", desc: "Edit profile and dietary settings" },
  { to: "/discover",           icon: "🔍", label: "Discover & Search",  desc: "Find restaurants nearby" },
  { to: "/app/health",         icon: "📊", label: "Health Dashboard",    desc: "Track your daily nutrition" },
  { to: "/feed",               icon: "👥", label: "Community Feed",      desc: "Follow friends, see reviews" },
  { to: "/app/meal-planner",   icon: "📋", label: "Meal Planner",        desc: "Plan your weekly meals" },
  { to: "/saved-dishes",       icon: "❤️", label: "Saved Dishes",        desc: "Your favorite dishes" },
  { to: "/food-lists",         icon: "📝", label: "Food Lists",          desc: "Curated food guides" },
];

export default function UserDashboard() {
  const { user } = useAuth();

  const sidebar = (
    <div className="kk-user-sidebar">
      <div className="kk-user-sidebar__avatar">
        {user?.name?.charAt(0).toUpperCase()}
      </div>
      <h3 className="kk-user-sidebar__name">{user?.name}</h3>
      <p className="kk-user-sidebar__email">{user?.email}</p>

      <div className="kk-user-sidebar__badges">
        {user?.isPremium && <Badge variant="info">Premium</Badge>}
        {!user?.isPremium && <Badge variant="neutral">Free plan</Badge>}
      </div>

      {user?.rewardPoints > 0 && (
        <div className="kk-user-sidebar__stat">
          <span className="kk-user-sidebar__stat-val">{user.rewardPoints}</span>
          <span className="kk-user-sidebar__stat-label">Reward Points</span>
        </div>
      )}

      {user?.dietaryPreferences?.length > 0 && (
        <div className="kk-user-sidebar__section">
          <h4>Dietary preferences</h4>
          <div className="kk-user-sidebar__tags">
            {user.dietaryPreferences.map((p) => (
              <Badge key={p}>{p}</Badge>
            ))}
          </div>
        </div>
      )}

      {user?.allergies?.length > 0 && (
        <div className="kk-user-sidebar__section">
          <h4>Allergies</h4>
          <div className="kk-user-sidebar__tags">
            {user.allergies.map((a) => (
              <Badge key={a} variant="spicy">{a}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout sidebar={sidebar}>
      <h2 className="kk-page-title">Dashboard</h2>
      <p className="kk-page-subtitle">
        Welcome back, {user?.name?.split(" ")[0]}. What would you like to do?
      </p>

      <div className="kk-feature-grid">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="kk-feature-link">
            <Card hover className="kk-feature-card">
              <span className="kk-feature-card__icon">{f.icon}</span>
              <h3 className="kk-feature-card__label">{f.label}</h3>
              <p className="kk-feature-card__desc">{f.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
