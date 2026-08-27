import { useState } from "react";
import { placeOrder, reserveTable } from "../api/orders";
import "../styles/orders.css";

export default function OrderBookingForm({ restaurantId, dishes = [] }) {
  const [tab, setTab] = useState("order");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [busy, setBusy] = useState(false);
  const [cart, setCart] = useState({});
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [specialReq, setSpecialReq] = useState("");

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const updateQty = (dishId, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[dishId] || 0) + delta;
      if (qty <= 0) delete next[dishId];
      else next[dishId] = qty;
      return next;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([dishId, qty]) => {
      const dish = dishes.find((d) => (d._id || d.id) === dishId);
      return dish ? { dishId, name: dish.name, price: dish.price, quantity: qty } : null;
    })
    .filter(Boolean);

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const submitOrder = async () => {
    if (cartItems.length === 0) return flash("Add at least one dish", "error");
    setBusy(true);
    try {
      await placeOrder(restaurantId, cartItems.map((i) => ({ dishId: i.dishId, quantity: i.quantity })));
      flash("Order placed! The restaurant will confirm shortly.");
      setCart({});
    } catch (err) {
      flash(err.response?.data?.message || "Could not place order", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitReservation = async () => {
    if (!resDate || !resTime || !partySize) return flash("Fill in all fields", "error");
    setBusy(true);
    try {
      await reserveTable({ restaurantId, reservationDate: resDate, reservationTime: resTime, partySize, specialRequests: specialReq });
      flash("Table reserved! Waiting for restaurant confirmation.");
      setResDate(""); setResTime(""); setPartySize(2); setSpecialReq("");
    } catch (err) {
      flash(err.response?.data?.message || "Could not reserve", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kk-order-form">
      <h3>Place an Order or Reserve a Table</h3>

      {msg.text && <div className={`kk-order-toast kk-order-toast--${msg.type}`}>{msg.text}</div>}

      <div className="kk-order-filters" style={{ marginBottom: "var(--kk-space-4)" }}>
        <button className={`kk-btn kk-btn--sm ${tab === "order" ? "kk-btn--primary" : "kk-btn--secondary"}`} onClick={() => setTab("order")}>
          🛒 Food Order
        </button>
        <button className={`kk-btn kk-btn--sm ${tab === "reserve" ? "kk-btn--primary" : "kk-btn--secondary"}`} onClick={() => setTab("reserve")}>
          📅 Reserve Table
        </button>
      </div>

      {tab === "order" && (
        <>
          {dishes.length === 0 ? (
            <p style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>No dishes available to order.</p>
          ) : (
            <>
              {dishes.map((d) => {
                const id = d._id || d.id;
                const qty = cart[id] || 0;
                return (
                  <div key={id} className="kk-order-form__row">
                    <span>{d.name} <span style={{ color: "var(--kk-text-muted)" }}>৳{d.price}</span></span>
                    <div className="kk-order-form__qty">
                      <button onClick={() => updateQty(id, -1)} disabled={qty === 0}>−</button>
                      <span style={{ minWidth: 20, textAlign: "center" }}>{qty}</span>
                      <button onClick={() => updateQty(id, 1)}>+</button>
                    </div>
                  </div>
                );
              })}
              {cartItems.length > 0 && (
                <div className="kk-order-form__total">
                  <span>Total ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>৳{total}</span>
                </div>
              )}
              <div style={{ marginTop: "var(--kk-space-4)" }}>
                <button className="kk-btn kk-btn--primary" onClick={submitOrder} disabled={busy || cartItems.length === 0}>
                  {busy ? "Placing order…" : "Place Order"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {tab === "reserve" && (
        <>
          <div className="kk-reserve-form">
            <input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            <input type="time" value={resTime} onChange={(e) => setResTime(e.target.value)} />
            <input type="number" min="1" max="50" placeholder="Party size" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} />
            <textarea placeholder="Special requests (optional)" value={specialReq} onChange={(e) => setSpecialReq(e.target.value)} maxLength={500} />
          </div>
          <div style={{ marginTop: "var(--kk-space-4)" }}>
            <button className="kk-btn kk-btn--primary" onClick={submitReservation} disabled={busy}>
              {busy ? "Reserving…" : "Reserve Table"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}