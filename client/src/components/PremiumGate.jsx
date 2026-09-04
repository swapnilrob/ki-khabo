import { Link } from "react-router-dom";
import { Card, Badge } from "./ui";

/**
 * Shown instead of a Premium-only feature's content when the logged-in
 * user isn't an active Premium subscriber. Mirrors the "Upgrade to unlock
 * AI features" copy already used on the dashboard's Subscription card.
 */
export default function PremiumGate({ icon = "⭐", title, description }) {
  return (
    <Card style={{ padding: 40, textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ marginBottom: 10 }}>
        <Badge variant="info">Premium feature</Badge>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--kk-text-secondary)", marginBottom: 20 }}>
        {description}
      </p>
      <Link to="/app/subscription" className="kk-btn kk-btn--primary">
        Upgrade to Premium
      </Link>
    </Card>
  );
}
