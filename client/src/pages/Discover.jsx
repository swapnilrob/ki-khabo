import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDiscoverFilters, searchRestaurants } from "../api/discover";
import StarRating from "../components/StarRating";
import RestaurantMap from "../components/RestaurantMap";
import "../styles/menu.css";
import "../styles/discover.css";

const PRICES = ["$", "$$", "$$$"];

export default function Discover() {
  // ── Filter controls (what the user picks) ───────────────────────
  const [q, setQ] = useState("");
  const [view, setView] = useState("list");       // "list" | "map"
  const [cuisine, setCuisine] = useState("");
  const [price, setPrice] = useState("");        // "" = any
  const [minRating, setMinRating] = useState(""); // "" = any
  const [sort, setSort] = useState("rating");
  const [coords, setCoords] = useState(null);     // { lat, lng } after "Near me"
  const [page, setPage] = useState(1);

  // ── Data from the server ────────────────────────────────────────
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Fill the cuisine dropdown once, on first load.
  useEffect(() => {
    fetchDiscoverFilters()
      .then((res) => setCuisineOptions(res.cuisines || []))
      .catch(() => setCuisineOptions([]));
  }, []);

  // Re-run the search whenever a filter changes. The 350ms timer is a
  // "debounce" — it waits until you stop typing before calling the API,
  // so one search fires instead of one per keystroke.
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const params = { sort, page };
      if (q.trim()) params.q = q.trim();
      if (cuisine) params.cuisine = cuisine;
      if (price) params.priceRange = price;
      if (minRating) params.minRating = minRating;
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
        params.radius = 5000; // 5 km
      }

      searchRestaurants(params)
        .then((res) => {
          setResults(res.restaurants || []);
          setMeta({ total: res.total || 0, pages: res.pages || 1 });
        })
        .catch(() => {
          setResults([]);
          setMeta({ total: 0, pages: 1 });
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(timer); // cancel the previous timer on every change
  }, [q, cuisine, price, minRating, sort, coords, page]);

  // Any filter change should send us back to page 1.
  const onFilterChange = (setter) => (value) => {
    setPage(1);
    setter(value);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation isn't supported here.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPage(1);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => alert("Couldn't get your location. Check browser permissions.")
    );
  };

  const clearAll = () => {
    setQ(""); setCuisine(""); setPrice(""); setMinRating("");
    setSort("rating"); setCoords(null); setPage(1);
  };

  return (
    <div className="profile-wrap">
      <Link to="/">← Home</Link>
      <h1 style={{ margin: "12px 0 16px" }}>Discover restaurants</h1>

      {/* ── Filter bar ── */}
      <div className="discover-filters">
        <input
          className="discover-search"
          placeholder="Search by name…"
          value={q}
          onChange={(e) => onFilterChange(setQ)(e.target.value)}
        />

        <div className="filter-row">
          <select value={cuisine} onChange={(e) => onFilterChange(setCuisine)(e.target.value)}>
            <option value="">All cuisines</option>
            {cuisineOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="price-group">
            {PRICES.map((p) => (
              <button
                key={p}
                className={`price-btn ${price === p ? "active" : ""}`}
                onClick={() => onFilterChange(setPrice)(price === p ? "" : p)}
              >
                {p}
              </button>
            ))}
          </div>

          <select value={minRating} onChange={(e) => onFilterChange(setMinRating)(e.target.value)}>
            <option value="">Any rating</option>
            <option value="4">4★ & up</option>
            <option value="3">3★ & up</option>
            <option value="2">2★ & up</option>
          </select>

          <select value={sort} onChange={(e) => onFilterChange(setSort)(e.target.value)}>
            <option value="rating">Top rated</option>
            <option value="name">Name (A–Z)</option>
          </select>

          <button className="ghost-btn" onClick={useMyLocation}>
            {coords ? "📍 Near me (on)" : "📍 Near me"}
          </button>
          <button className="ghost-btn" onClick={clearAll}>Clear</button>
        </div>
      </div>

      {/* ── List / Map toggle ── */}
      <div className="view-toggle">
        <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
          ☰ List
        </button>
        <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
          🗺️ Map
        </button>
      </div>

      {/* ── Results ── */}
      {loading ? (
        <p style={{ color: "#666" }}>Loading…</p>
      ) : view === "map" ? (
        <>
          <p style={{ color: "#666", margin: "4px 0 12px" }}>
            {meta.total} restaurant{meta.total === 1 ? "" : "s"} found
          </p>
          <RestaurantMap restaurants={results} userCoords={coords} />
        </>
      ) : (
        <>
          <p style={{ color: "#666", margin: "4px 0 12px" }}>
            {meta.total} restaurant{meta.total === 1 ? "" : "s"} found
          </p>

          {results.length === 0 && <p>No restaurants match these filters.</p>}

          {results.map((r) => (
            <div key={r._id} className="restaurant-list-item">
              <div>
                <div style={{ fontWeight: 700 }}>{r.businessName}</div>
                <small style={{ color: "#666" }}>
                  {r.city} · {r.priceRange}
                  {r.cuisineTypes?.length ? " · " + r.cuisineTypes.join(", ") : ""}
                </small>
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <StarRating value={r.averageRating} size={14} />
                  {typeof r.distance === "number" && (
                    <span className="distance-badge">
                      {(r.distance / 1000).toFixed(1)} km away
                    </span>
                  )}
                </div>
              </div>
              <Link to={`/restaurant/${r._id}`}>
                <button>View menu</button>
              </Link>
            </div>
          ))}

          {/* ── Pagination ── */}
          {meta.pages > 1 && (
            <div className="pager">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <span>Page {page} of {meta.pages}</span>
              <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}