import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDiscoverFilters, searchRestaurants } from "../api/discover";
import StarRating from "../components/StarRating";
import RestaurantMap from "../components/RestaurantMap";
import AppLayout from "../components/AppLayout";
import "../styles/discover.css";

const PRICES = ["$", "$$", "$$$"];

export default function Discover() {
  const [q, setQ] = useState("");
  const [view, setView] = useState("list");
  const [cuisine, setCuisine] = useState("");
  const [price, setPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState("rating");
  const [coords, setCoords] = useState(null);
  const [page, setPage] = useState(1);

  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoverFilters()
      .then((res) => setCuisineOptions(res.cuisines || []))
      .catch(() => setCuisineOptions([]));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSort("distance");
        },
        () => console.log("Location not available, showing default results")
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const params = { sort, page };
      if (q.trim()) params.q = q.trim();
      if (cuisine) params.cuisine = cuisine;
      if (price) params.priceRange = price;
      if (minRating) params.minRating = minRating;
      if (coords) { params.lat = coords.lat; params.lng = coords.lng; params.radius = 50000; }

      searchRestaurants(params)
        .then((res) => { setResults(res.restaurants || []); setMeta({ total: res.total || 0, pages: res.pages || 1 }); })
        .catch(() => { setResults([]); setMeta({ total: 0, pages: 1 }); })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [q, cuisine, price, minRating, sort, coords, page]);

  const onFilterChange = (setter) => (value) => { setPage(1); setter(value); };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation isn't supported here.");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPage(1); setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => alert("Couldn't get your location. Check browser permissions.")
    );
  };

  const clearAll = () => { setQ(""); setCuisine(""); setPrice(""); setMinRating(""); setSort("rating"); setCoords(null); setPage(1); };

  return (
    <AppLayout>
      <h2 className="kk-page-title">Discover Restaurants</h2>
      <p className="kk-page-subtitle">Search, filter, and explore restaurants near you.</p>

      <div className="discover-filters">
        <input
          className="discover-search"
          placeholder="Search by restaurant name…"
          value={q}
          onChange={(e) => onFilterChange(setQ)(e.target.value)}
        />

        <div className="filter-row">
          <select value={cuisine} onChange={(e) => onFilterChange(setCuisine)(e.target.value)}>
            <option value="">All cuisines</option>
            {cuisineOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="price-group">
            {PRICES.map((p) => (
              <button key={p} className={`price-btn ${price === p ? "active" : ""}`} onClick={() => onFilterChange(setPrice)(price === p ? "" : p)}>
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
            <option value="distance">Nearest first</option>
          </select>

          <button className="ghost-btn" onClick={useMyLocation}>
            {coords ? "📍 Near me (on)" : "📍 Near me"}
          </button>
          <button className="ghost-btn" onClick={clearAll}>Clear all</button>
        </div>
      </div>

      <div className="view-toggle">
        <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☰ List</button>
        <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>🗺️ Map</button>
      </div>

      {loading ? (
        <p style={{ color: "var(--kk-text-muted)", marginTop: "var(--kk-space-3)" }}>Loading…</p>
      ) : view === "map" ? (
        <>
          <p style={{ color: "var(--kk-text-muted)", margin: "var(--kk-space-1) 0 var(--kk-space-3)" }}>
            {meta.total} restaurant{meta.total === 1 ? "" : "s"} found
          </p>
          <RestaurantMap restaurants={results} userCoords={coords} />
        </>
      ) : (
        <>
          <p style={{ color: "var(--kk-text-muted)", margin: "var(--kk-space-1) 0 var(--kk-space-3)" }}>
            {meta.total} restaurant{meta.total === 1 ? "" : "s"} found
          </p>

          {results.length === 0 && (
            <div style={{ textAlign: "center", padding: "var(--kk-space-8) var(--kk-space-5)", color: "var(--kk-text-muted)" }}>
              No restaurants match these filters. Try broadening your search.
            </div>
          )}

          {results.map((r) => (
            <div key={r._id} className="restaurant-list-item">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--kk-text)" }}>{r.businessName}</div>
                <small>
                  {r.city} · {r.priceRange}
                  {r.cuisineTypes?.length ? " · " + r.cuisineTypes.join(", ") : ""}
                </small>
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <StarRating value={r.averageRating} size={14} />
                  {typeof r.distance === "number" && (
                    <span className="distance-badge">
                      {(r.distance / 1000).toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
              <Link to={`/restaurant/${r._id}`}>
                <button className="kk-btn kk-btn--primary kk-btn--sm">View menu</button>
              </Link>
            </div>
          ))}

          {meta.pages > 1 && (
            <div className="pager">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span>Page {page} of {meta.pages}</span>
              <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}