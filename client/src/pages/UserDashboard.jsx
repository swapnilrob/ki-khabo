import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card, Badge } from "../components/ui";
import "./UserDashboard.css";

const MAIN_FEATURES = [
  { to: "/discover",           icon: "🔍", label: "Discover & Search",     desc: "Find restaurants nearby" },
  { to: "/app/recommendations", icon: "🎯", label: "Recommendations",      desc: "Dishes picked for you" },
  { to: "/app/health",         icon: "📊", label: "Health Dashboard",      desc: "Track your daily nutrition" },
  { to: "/app/meal-planner",   icon: "📋", label: "Meal Planner",          desc: "Plan your weekly meals" },
  { to: "/app/orders",         icon: "🛒", label: "My Orders",             desc: "Track orders & reservations" },
];

const SOCIAL = [
  { to: "/feed",               icon: "👥", label: "Community Feed",        desc: "Follow friends, see reviews" },
  { to: "/saved-dishes",       icon: "❤️", label: "Saved Dishes",          desc: "Your favorite dishes" },
  { to: "/food-lists",         icon: "📝", label: "Food Lists",            desc: "Curated food guides" },
];

const SETTINGS = [
  { to: "/app/preferences",    icon: "👤", label: "Edit Profile",          desc: "Name, location, password" },
  { to: "/app/preferences",    icon: "🥗", label: "Dietary Preferences",  desc: "Allergies and diet settings" },
  { to: "/app/subscription",   icon: "⭐", label: "Premium & Subscription", desc: "Upgrade to unlock AI features" },
  { to: "/app/rewards",        icon: "🎁", label: "Reward Points",        desc: "Earn and redeem loyalty points" }, 

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
        {user?.isPremium ? <Badge variant="info">Premium</Badge> : <Badge variant="neutral">Free plan</Badge>}
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
            {user.dietaryPreferences.map((p) => <Badge key={p}>{p}</Badge>)}
          </div>
        </div>
      )}

      {user?.allergies?.length > 0 && (
        <div className="kk-user-sidebar__section">
          <h4>Allergies</h4>
          <div className="kk-user-sidebar__tags">
            {user.allergies.map((a) => <Badge key={a} variant="spicy">{a}</Badge>)}
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
        {MAIN_FEATURES.map((f) => (
          <Link key={f.to + f.label} to={f.to} className="kk-feature-link">
            <Card hover className="kk-feature-card">
              <span className="kk-feature-card__icon">{f.icon}</span>
              <h3 className="kk-feature-card__label">{f.label}</h3>
              <p className="kk-feature-card__desc">{f.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h3 className="kk-section-heading">Social</h3>
      <div className="kk-feature-grid">
        {SOCIAL.map((f) => (
          <Link key={f.to + f.label} to={f.to} className="kk-feature-link">
            <Card hover className="kk-feature-card">
              <span className="kk-feature-card__icon">{f.icon}</span>
              <h3 className="kk-feature-card__label">{f.label}</h3>
              <p className="kk-feature-card__desc">{f.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h3 className="kk-section-heading">Settings</h3>
      <div className="kk-feature-grid">
        {SETTINGS.map((f) => (
          <Link key={f.label} to={f.to} className="kk-feature-link">
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