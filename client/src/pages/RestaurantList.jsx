import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRestaurants } from "../api/dishes";
import StarRating from "../components/StarRating";
import "../styles/menu.css";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants()
      .then((res) => setRestaurants(res.restaurants || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="profile-wrap">
      <Link to="/">← Home</Link>
      <h1 style={{ margin: "12px 0 16px" }}>Restaurants</h1>

      {restaurants.length === 0 && <p>No approved restaurants yet.</p>}

      {restaurants.map((r) => (
        <div key={r._id} className="restaurant-list-item">
          <div>
            <div style={{ fontWeight: 700 }}>{r.businessName}</div>
            <small style={{ color: "#666" }}>
              {r.city} · {r.priceRange} · {r.cuisineTypes?.join(", ")}
            </small>
            <div style={{ marginTop: 4 }}>
              <StarRating value={r.averageRating} size={14} />
            </div>
          </div>
          <Link to={`/restaurant/${r._id}`}>
            <button>View menu</button>
          </Link>
        </div>
      ))}
    </div>
  );
}