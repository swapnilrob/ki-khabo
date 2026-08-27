import { useEffect, useState } from "react";
import { fetchRestaurantOrders, approveOrder as apiApprove, rejectOrder as apiReject, rescheduleOrder as apiReschedule, completeOrder as apiComplete } from "../api/orders";
import AppLayout from "../components/AppLayout";
import { Badge } from "../components/ui";
import "../styles/orders.css";

const STATUS_VARIANT = { pending: "neutral", approved: "success", rejected: "danger", rescheduled: "info", completed: "success", cancelled: "neutral" };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const load = () => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    fetchRestaurantOrders(params)
      .then((res) => setOrders(res.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const flash = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 3000); };

  const handleApprove = async (id) => {
    try { await apiApprove(id); flash("Order approved"); load(); }
    catch (err) { flash(err.response?.data?.message || "Failed", "error"); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection (optional):");
    if (reason === null) return;
    try { await apiReject(id, reason); flash("Order rejected"); load(); }
    catch (err) { flash(err.response?.data?.message || "Failed", "error"); }
  };

  const handleReschedule = async (id) => {
    if (!newDate || !newTime) { flash("Pick a date and time", "error"); return; }
    try {
      await apiReschedule(id, newDate, newTime);
      flash("Rescheduled — waiting for user confirmation");
      setRescheduleId(null); setNewDate(""); setNewTime("");
      load();
    } catch (err) { flash(err.response?.data?.message || "Failed", "error"); }
  };

  const handleComplete = async (id) => {
    try { await apiComplete(id); flash("Marked as completed"); load(); }
    catch (err) { flash(err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <AppLayout>
      <h2 className="kk-page-title">Orders & Reservations</h2>
      <p className="kk-page-subtitle">Manage incoming requests from customers.</p>

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
        <div className="kk-order-empty">No orders yet.</div>
      ) : (
        orders.map((o) => (
          <div key={o._id} className="kk-order-card">
            <div className="kk-order-card__header">
              <div>
                <div className="kk-order-card__title">{o.user?.name || "Customer"}</div>
                <div className="kk-order-card__sub">
                  {o.type === "order" ? "🛒 Food Order" : "📅 Reservation"} · {fmtDateTime(o.createdAt)}
                  {o.user?.phone && ` · 📞 ${o.user.phone}`}
                </div>
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
                Waiting for customer to confirm: <strong>{fmtDate(o.rescheduledDate)}</strong> at <strong>{o.rescheduledTime}</strong>
              </div>
            )}

            {rescheduleId === o._id && (
              <div className="kk-reschedule-form">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => handleReschedule(o._id)}>Send</button>
                <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => { setRescheduleId(null); setNewDate(""); setNewTime(""); }}>Cancel</button>
              </div>
            )}

            <div className="kk-order-card__actions">
              {o.status === "pending" && (
                <>
                  <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => handleApprove(o._id)}>Approve</button>
                  <button className="kk-btn kk-btn--danger kk-btn--sm" onClick={() => handleReject(o._id)}>Reject</button>
                  {o.type === "reservation" && (
                    <button className="kk-btn kk-btn--secondary kk-btn--sm" onClick={() => setRescheduleId(rescheduleId === o._id ? null : o._id)}>Reschedule</button>
                  )}
                </>
              )}
              {o.status === "approved" && (
                <>
                  <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={() => handleComplete(o._id)}>Mark completed</button>
                  {o.type === "reservation" && (
                    <button className="kk-btn kk-btn--secondary kk-btn--sm" onClick={() => setRescheduleId(rescheduleId === o._id ? null : o._id)}>Reschedule</button>
                  )}
                </>
              )}
            </div>
          </div>
        ))
      )}
    </AppLayout>
  );
}