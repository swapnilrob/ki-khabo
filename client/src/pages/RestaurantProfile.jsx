import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchRestaurantProfile } from "../api/dishes";
import StarRating from "../components/StarRating";
import DishCard from "../components/DishCard";
import "../styles/menu.css";

export default function RestaurantProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRestaurantProfile(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || "Could not load restaurant");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error)
    return (
      <div className="profile-wrap">
        <p className="error">{error}</p>
        <Link to="/restaurants">← Back to restaurants</Link>
      </div>
    );

  const { restaurant, menuByCategory, menuCount } = data;
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

      <h2 style={{ fontSize: 20 }}>Menu ({menuCount})</h2>

      {menuCount === 0 && (
        <p style={{ color: "#666", marginTop: 12 }}>
          This restaurant hasn't added any dishes yet.
        </p>
      )}

      {categories.map((cat) => (
        <section key={cat}>
          <h3 className="menu-section-title">{cat}</h3>
          {menuByCategory[cat].map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </section>
      ))}
    </div>
  );
}