import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchRestaurantProfile } from "../api/dishes";
import StarRating from "../components/StarRating";
import DishCard from "../components/DishCard";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import { fetchRestaurantReviews, checkReviewEligibility } from "../api/reviews";
import { placeOrder, reserveTable } from "../api/orders";
import { useAuth } from "../context/AuthContext";
import "../styles/menu.css";

export default function RestaurantProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ average: 0, count: 0 });
  const { user } = useAuth();

  // Cart state
  const [cart, setCart] = useState({});
  const [orderMsg, setOrderMsg] = useState({ text: "", type: "" });
  const [busy, setBusy] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Reserve state
  const [showReserve, setShowReserve] = useState(false);
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [specialReq, setSpecialReq] = useState("");

  // Review eligibility
  const [canReviewRestaurant, setCanReviewRestaurant] = useState(false);
  const [eligibleDishIds, setEligibleDishIds] = useState([]);

  const flash = (text, type = "success") => {
    setOrderMsg({ text, type });
    setTimeout(() => setOrderMsg({ text: "", type: "" }), 4000);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRestaurantProfile(id)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || "Could not load restaurant"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchRestaurantReviews(id)
      .then((res) => {
        setReviews(res.reviews || []);
        setReviewMeta({
          average: res.averageRating || 0,
          count: res.totalReviews || res.reviews?.length || 0,
        });
      })
      .catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
    if (!id || !user || user.role !== "user") return;
    checkReviewEligibility(id)
      .then((res) => {
        setCanReviewRestaurant(res.canReviewRestaurant);
        setEligibleDishIds(res.eligibleDishIds || []);
      })
      .catch(() => {
        setCanReviewRestaurant(false);
        setEligibleDishIds([]);
      });
  }, [id, user]);

  const handleNewReview = (newReview) => {
    const enriched = { ...newReview, user: { name: user.name } };
    setReviews((prev) => [enriched, ...prev]);
    setReviewMeta((prev) => ({
      count: prev.count + 1,
      average: (prev.average * prev.count + newReview.rating) / (prev.count + 1),
    }));
  };

  const handleAddToCart = (dishId, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[dishId] || 0) + delta;
      if (qty <= 0) delete next[dishId];
      else next[dishId] = qty;
      return next;
    });
  };

  const allDishes = data ? Object.values(data.menuByCategory).flat() : [];
  const cartItems = Object.entries(cart)
    .map(([dishId, qty]) => {
      const dish = allDishes.find((d) => (d.id || d._id) === dishId);
      return dish ? { dishId, name: dish.name, price: dish.price, quantity: qty } : null;
    })
    .filter(Boolean);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const submitOrder = async () => {
    if (cartItems.length === 0) return flash("Add at least one dish", "error");
    setBusy(true);
    try {
      await placeOrder(id, cartItems.map((i) => ({ dishId: i.dishId, quantity: i.quantity })));
      flash("Order placed! The restaurant will confirm shortly.");
      setCart({});
      setShowCart(false);
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
      await reserveTable({ restaurantId: id, reservationDate: resDate, reservationTime: resTime, partySize, specialRequests: specialReq });
      flash("Table reserved! Waiting for restaurant confirmation.");
      setResDate(""); setResTime(""); setPartySize(2); setSpecialReq("");
      setShowReserve(false);
    } catch (err) {
      flash(err.response?.data?.message || "Could not reserve", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error) return (
    <div className="profile-wrap">
      <p className="error">{error}</p>
      <Link to="/restaurants">← Back to restaurants</Link>
    </div>
  );

  const { restaurant, menuByCategory, menuCount, filtered, hiddenCount } = data;
  const categories = Object.keys(menuByCategory);

  return (
    <div className="profile-wrap">
      <Link to="/restaurants">← All restaurants</Link>

      <div className="profile-header" style={{ marginTop: 12 }}>
        <h1>{restaurant.businessName}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <StarRating value={restaurant.averageRating} size={18} />
          <small style={{ color: "#666" }}>
            {restaurant.averageRating > 0
              ? `${restaurant.averageRating} from ${restaurant.totalReviews} reviews`
              : "No reviews yet"}
          </small>
        </div>
        <p className="profile-meta">📍 {restaurant.address}, {restaurant.city}</p>
        <p className="profile-meta">🕐 {restaurant.openingHours || "Hours not listed"}</p>
        <p className="profile-meta">📞 {restaurant.phone} · {restaurant.priceRange}</p>
        <div>
          {restaurant.cuisineTypes?.map((c) => (
            <span key={c} className="cuisine-chip">{c}</span>
          ))}
        </div>
      </div>

      {filtered && (
        <p style={{ color: "#666", fontSize: 13, margin: "12px 0" }}>
          {hiddenCount} item{hiddenCount > 1 ? "s" : ""} hidden based on your
          dietary preferences and allergies. <Link to="/app/preferences">Edit preferences</Link>
        </p>
      )}

      {/* ── Reserve a Table (before menu, always visible) ── */}
      {user && user.role === "user" && (
        <div style={{
          margin: "20px 0",
          padding: 20,
          background: "var(--kk-white)",
          border: "1px solid var(--kk-border)",
          borderRadius: "var(--kk-radius)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>📅 Reserve a Table</h3>
            <button
              className="kk-btn kk-btn--sm kk-btn--secondary"
              onClick={() => setShowReserve((prev) => !prev)}
            >
              {showReserve ? "Hide" : "Book Now"}
            </button>
          </div>

          {orderMsg.text && !showCart && (
            <div className={`kk-order-toast kk-order-toast--${orderMsg.type}`} style={{ marginTop: 10 }}>{orderMsg.text}</div>
          )}

          {showReserve && (
            <div className="kk-reserve-form" style={{ marginTop: 14 }}>
              <input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              <input type="time" value={resTime} onChange={(e) => setResTime(e.target.value)} />
              <input type="number" min="1" max="50" placeholder="Party size" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} />
              <textarea placeholder="Special requests (optional)" value={specialReq} onChange={(e) => setSpecialReq(e.target.value)} maxLength={500} />
              <button className="kk-btn kk-btn--primary" onClick={submitReservation} disabled={busy} style={{ width: "100%", marginTop: 8 }}>
                {busy ? "Reserving…" : "Reserve Table"}
              </button>
            </div>
          )}
        </div>
      )}

      <h2 style={{ fontSize: 20 }}>Menu ({menuCount})</h2>

      {menuCount === 0 && (
        <p style={{ color: "#666", marginTop: 12 }}>
          This restaurant hasn't added any dishes yet.
        </p>
      )}

      {categories.map((cat) => (
        <section key={cat}>
          <h3 className="menu-section-title">{cat}</h3>
          {menuByCategory[cat].map((dish) => {
            const dishId = dish.id || dish._id;
            return (
              <DishCard
                key={dishId}
                dish={dish}
                restaurantId={id}
                cartQty={cart[dishId] || 0}
                onAddToCart={user?.role === "user" ? handleAddToCart : undefined}
                canReviewDish={eligibleDishIds.includes(dishId)}
              />
            );
          })}
        </section>
      ))}

      {/* ── Floating Cart Bar ── */}
      {user && user.role === "user" && cartCount > 0 && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--kk-orange)",
          color: "#fff",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 1000,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.15)",
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            🛒 {cartCount} item{cartCount > 1 ? "s" : ""} · ৳{cartTotal}
          </span>
          <button
            onClick={() => setShowCart(true)}
            style={{
              background: "#fff",
              color: "var(--kk-orange)",
              border: "none",
              padding: "8px 20px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            View Cart & Order
          </button>
        </div>
      )}

      {/* ── Cart Drawer ── */}
      {showCart && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1001,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px 16px 0 0",
            padding: 24,
            width: "100%",
            maxWidth: 500,
            maxHeight: "70vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>🛒 Your Cart</h3>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {orderMsg.text && (
              <div className={`kk-order-toast kk-order-toast--${orderMsg.type}`} style={{ marginBottom: 12 }}>{orderMsg.text}</div>
            )}

            {cartItems.length === 0 ? (
              <p style={{ color: "#888" }}>Your cart is empty</p>
            ) : (
              <>
                {cartItems.map((item) => (
                  <div key={item.dishId} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{item.name}</strong>
                      <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>৳{item.price} each</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button className="kk-btn kk-btn--sm kk-btn--secondary" onClick={() => handleAddToCart(item.dishId, -1)} style={{ minWidth: 28 }}>−</button>
                      <span style={{ fontWeight: 700 }}>{item.quantity}</span>
                      <button className="kk-btn kk-btn--sm kk-btn--secondary" onClick={() => handleAddToCart(item.dishId, 1)} style={{ minWidth: 28 }}>+</button>
                      <span style={{ fontWeight: 700, minWidth: 50, textAlign: "right" }}>৳{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", fontWeight: 700, fontSize: 16 }}>
                  <span>Total</span>
                  <span>৳{cartTotal}</span>
                </div>

                <button
                  className="kk-btn kk-btn--primary"
                  style={{ width: "100%", padding: "12px", fontSize: 15 }}
                  onClick={submitOrder}
                  disabled={busy}
                >
                  {busy ? "Placing order…" : `Confirm Order · ৳${cartTotal}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Restaurant Reviews ── */}
      <hr style={{ margin: "32px 0 24px", border: "none", borderTop: "1px solid #eee" }} />

      <ReviewList
        reviews={reviews}
        average={reviewMeta.average}
        count={reviewMeta.count}
        title="Restaurant Reviews"
      />

      {user && canReviewRestaurant ? (
        <div style={{ marginTop: 20 }}>
          <ReviewForm
            restaurantId={id}
            targetType="restaurant"
            onSubmitted={handleNewReview}
          />
        </div>
      ) : user && user.role === "user" ? (
        <p style={{ color: "#888", marginTop: 16, fontSize: 13 }}>
          You need to have a completed order from this restaurant before leaving a review.
        </p>
      ) : !user ? (
        <p style={{ color: "#666", marginTop: 16 }}>
          <Link to="/login">Log in</Link> to leave a review.
        </p>
      ) : null}

      {/* Bottom padding so floating cart doesn't cover content */}
      {cartCount > 0 && <div style={{ height: 60 }} />}
    </div>
  );
} 