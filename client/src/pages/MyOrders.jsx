import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders, cancelOrder as apiCancel, acceptReschedule as apiAccept } from "../api/orders";
import AppLayout from "../components/AppLayout";
import { Badge } from "../components/ui";
import "../styles/orders.css";

const STATUS_VARIANT = { pending: "neutral", approved: "success", rejected: "danger", rescheduled: "info", completed: "success", cancelled: "neutral" };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = () => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    fetchMyOrders(params)
      .then((res) => setOrders(res.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const flash = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 3000); };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try { await apiCancel(id); flash("Order cancelled"); load(); }
    catch (err) { flash(err.response?.data?.message || "Could not cancel", "error"); }
  };

  const handleAcceptReschedule = async (id) => {
    try { await apiAccept(id); flash("New time accepted"); load(); }
    catch (err) { flash(err.response?.data?.message || "Could not accept", "error"); }
  };

  return (
    <AppLayout>
      <h2 className="kk-page-title">My Orders & Reservations</h2>
      <p className="kk-page-subtitle">Track the status of everything you've placed.</p>

      {msg.text && <div className={`kk-order-toast kk-order-toast--${msg.type}`}>{msg.text}</div>}

      <div className="kk-order-filters">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="order">Food orders</option>
          <option value="reservation">Reservations</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className="kk-order-empty">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="kk-order-empty">No orders yet. <Link to="/discover" style={{ color: "var(--kk-orange)" }}>Discover restaurants →</Link></div>
      ) : (
        orders.map((o) => (
          <div key={o._id} className="kk-order-card">
            <div className="kk-order-card__header">
              <div>
                <div className="kk-order-card__title">{o.restaurant?.businessName || "Restaurant"}</div>
                <div className="kk-order-card__sub">{o.type === "order" ? "🛒 Food Order" : "📅 Reservation"} · {fmtDateTime(o.createdAt)}</div>
              </div>
              <Badge variant={STATUS_VARIANT[o.status] || "neutral"}>{o.status}</Badge>
            </div>

            {o.type === "order" && o.items?.length > 0 && (
              <div className="kk-order-items">
                {o.items.map((item, i) => (
                  <div key={i} className="kk-order-items__row">
                    <span>{item.name} × {item.quantity}</span>
                    <span>৳{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="kk-order-items__total"><span>Total</span><span>৳{o.totalAmount}</span></div>
              </div>
            )}

            {o.type === "reservation" && (
              <div className="kk-order-card__meta">
                <strong>Date:</strong> {fmtDate(o.reservationDate)} · <strong>Time:</strong> {o.reservationTime} · <strong>Party:</strong> {o.partySize} {o.partySize === 1 ? "guest" : "guests"}
                {o.specialRequests && (<><br /><strong>Note:</strong> {o.specialRequests}</>)}
              </div>
            )}

            {o.status === "rescheduled" && (
              <div className="kk-reschedule-banner">
                <span>The restaurant has offered a new time: <strong>{fmtDate(o.rescheduledDate)}</strong> at <strong>{o.rescheduledTime}</strong></span>
                <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => handleAcceptReschedule(o._id)}>Accept</button>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => handleCancel(o._id)}>Cancel instead</button>
              </div>
            )}

            {o.status === "rejected" && o.rejectionReason && (
              <div style={{ marginTop: "var(--kk-space-2)", fontSize: 13, color: "var(--kk-red)" }}>Reason: {o.rejectionReason}</div>
            )}

            {o.reviewEligible && o.status === "completed" && (
              <div className="kk-review-eligible">
                ✅ You can now <Link to={`/restaurant/${o.restaurant?._id || o.restaurant}`} style={{ color: "var(--kk-green)", textDecoration: "underline", marginLeft: 4 }}>leave a review</Link>
              </div>
            )}

            {["pending", "rescheduled"].includes(o.status) && (
              <div className="kk-order-card__actions">
                <button className="kk-btn kk-btn--danger kk-btn--sm" onClick={() => handleCancel(o._id)}>Cancel</button>
              </div>
            )}
          </div>
        ))
      )}
    </AppLayout>
  );
}