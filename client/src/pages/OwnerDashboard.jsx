import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card, Badge } from "../components/ui";
import "./OwnerDashboard.css";

export default function OwnerDashboard() {
  const { user, restaurant } = useAuth();

  const statusVariant =
    restaurant?.status === "approved" ? "success" :
    restaurant?.status === "rejected" ? "danger" : "neutral";

  return (
    <AppLayout>
      <h2 className="kk-page-title">Restaurant Dashboard</h2>
      <p className="kk-page-subtitle">
        Manage {restaurant?.businessName || "your restaurant"}
      </p>

      {restaurant?.status === "pending" && (
        <div className="kk-status-banner kk-status-banner--pending">
          <span className="kk-status-banner__icon">&#9203;</span>
          <div>
            <strong>Verification in progress</strong>
            <p>Your restaurant is awaiting admin review. You will be notified once it is approved.</p>
          </div>
        </div>
      )}

      {restaurant?.status === "rejected" && (
        <div className="kk-status-banner kk-status-banner--rejected">
          <span className="kk-status-banner__icon">&#10060;</span>
          <div>
            <strong>Application rejected</strong>
            <p>{restaurant.rejectionReason || "Contact support for details."}</p>
          </div>
        </div>
      )}

      <Card className="kk-owner-info">
        <div className="kk-owner-info__row">
          <div>
            <h3>{restaurant?.businessName || "—"}</h3>
            <p className="kk-owner-info__sub">{user?.email}</p>
          </div>
          <Badge variant={statusVariant}>
            {restaurant?.status || "No restaurant"}
          </Badge>
        </div>
      </Card>

      {restaurant?.status === "approved" && (
        <div className="kk-owner-grid">
          <Link to="/owner/menu" style={{ textDecoration: "none", color: "inherit" }}>
            <Card hover className="kk-owner-card">
              <span className="kk-owner-card__icon">&#128221;</span>
              <h3>Menu Management</h3>
              <p>Add, edit, or remove dishes and nutritional info.</p>
            </Card>
          </Link>
          <Link to="/owner/orders" style={{ textDecoration: "none", color: "inherit" }}>
            <Card hover className="kk-owner-card">
              <span className="kk-owner-card__icon">&#128230;</span>
              <h3>Orders & Bookings</h3>
              <p>Approve, reject, or reschedule incoming requests.</p>
            </Card>
          </Link>
          <Link to="/owner/analytics" style={{ textDecoration: "none", color: "inherit" }}>
            <Card hover className="kk-owner-card">
              <span className="kk-owner-card__icon">&#128200;</span>
              <h3>Analytics</h3>
              <p>Track orders, revenue, and ratings over time.</p>
            </Card>
          </Link>
          <Link to="/owner/reviews" style={{ textDecoration: "none", color: "inherit" }}>
            <Card hover className="kk-owner-card">
              <span className="kk-owner-card__icon">&#128172;</span>
              <h3>Reviews</h3>
              <p>Read and respond to customer feedback.</p>
            </Card>
          </Link>
        </div>
      )}
    </AppLayout>
  );
}