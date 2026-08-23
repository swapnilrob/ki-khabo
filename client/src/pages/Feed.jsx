import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFeed, searchUsers, followUser, unfollowUser, getFollowStatus } from "../api/community";
import StarRating from "../components/StarRating";

export default function Feed() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ── User search state ──
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [followState, setFollowState] = useState({}); // { [userId]: true/false }

  const loadFeed = useCallback(() => {
    setLoading(true);
    getFeed()
      .then((data) => { setFeed(data.feed); setMessage(data.message || ""); })
      .catch(() => setMessage("Could not load feed."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // ── Search users ──
  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const data = await searchUsers(query);
      setResults(data.users);
      // Check follow status for each result
      const statuses = {};
      await Promise.all(data.users.map(async (u) => {
        try {
          const s = await getFollowStatus(u.id);
          statuses[u.id] = s.isFollowing;
        } catch { statuses[u.id] = false; }
      }));
      setFollowState(statuses);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const toggleFollow = async (userId) => {
    try {
      if (followState[userId]) {
        await unfollowUser(userId);
        setFollowState((p) => ({ ...p, [userId]: false }));
      } else {
        await followUser(userId);
        setFollowState((p) => ({ ...p, [userId]: true }));
        loadFeed(); // refresh feed after new follow
      }
    } catch (err) { console.error(err.response?.data?.message); }
  };

  // ── Styles ──
  const card = { border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fff" };
  const avatar = (name) => ({
    width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, color: "#2563eb", fontSize: 15, flexShrink: 0,
  });
  const pill = (active) => ({
    padding: "5px 14px", borderRadius: 20, border: active ? "none" : "1px solid #ccc",
    background: active ? "#2563eb" : "#fff", color: active ? "#fff" : "#333",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
  });

  return (
    <div style={{ padding: 24, maxWidth: 620, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      {/* Back button */}
      <button onClick={() => navigate("/app")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#2563eb", fontWeight: 600, marginBottom: 12, padding: 0 }}>
        ← Back to Dashboard
      </button>

      <h2 style={{ marginBottom: 4 }}>Your Feed</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>See what people you follow are up to</p>

      {/* ── Search Users Section ── */}
      <div style={{ ...card, background: "#f8fafc" }}>
        <h4 style={{ margin: "0 0 8px" }}>Find &amp; Follow Users</h4>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name…"
            style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd", fontFamily: "inherit" }}
          />
          <button onClick={handleSearch} disabled={searching} style={pill(true)}>
            {searching ? "…" : "Search"}
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {results.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div style={avatar(u.name)}>{u.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <strong>{u.name}</strong>
                  {u.email && <span style={{ color: "#888", fontSize: 13, marginLeft: 6 }}>{u.email}</span>}
                </div>
                <button onClick={() => toggleFollow(u.id)} style={pill(followState[u.id])}>
                  {followState[u.id] ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Feed Timeline ── */}
      <h3 style={{ marginTop: 20, marginBottom: 10 }}>Activity</h3>

      {loading && <p style={{ color: "#888" }}>Loading your feed…</p>}

      {!loading && message && feed.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 32 }}>
          <p style={{ fontSize: 18, marginBottom: 4 }}>No activity yet</p>
          <p style={{ color: "#888" }}>{message}</p>
          <p style={{ color: "#888", fontSize: 13 }}>Use the search above to find and follow users!</p>
        </div>
      )}

      {feed.map((item) => (
        <div key={`${item.activityType}-${item.id}`} style={card}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={avatar(item.user?.name)}>{item.user?.name?.charAt(0) || "?"}</div>
            <div style={{ flex: 1 }}>
              <strong>{item.user?.name || "Someone"}</strong>
              <span style={{ color: "#2563eb", fontSize: 13, marginLeft: 6 }}>
                {item.activityType === "review" && (item.targetType === "dish" ? "reviewed a dish" : "reviewed a restaurant")}
                {item.activityType === "saved_dish" && "saved a dish"}
                {item.activityType === "food_list" && "created a food list"}
              </span>
            </div>
            <span style={{ color: "#aaa", fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Review card */}
          {item.activityType === "review" && (
            <div style={{ background: "#fefce8", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <StarRating value={item.rating} size={16} />
                <span style={{ fontWeight: 600 }}>
                  {item.targetType === "dish" ? item.dish?.name : item.restaurant?.businessName}
                </span>
              </div>
              {item.comment && <p style={{ margin: "6px 0 0", color: "#555" }}>{item.comment}</p>}
              {item.restaurant && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
                  📍 {item.restaurant.businessName}{item.restaurant.city ? `, ${item.restaurant.city}` : ""}
                </p>
              )}
            </div>
          )}

          {/* Saved dish card */}
          {item.activityType === "saved_dish" && (
            <div style={{ background: "#ecfdf5", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: 0 }}>
                💾 Saved <strong>{item.dish?.name || "a dish"}</strong>
                {item.dish?.price != null && <span style={{ color: "#888" }}> — ৳{item.dish.price}</span>}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>
                to collection: {item.collectionName || "Favorites"}
              </p>
            </div>
          )}

          {/* Food list card */}
          {item.activityType === "food_list" && (
            <div style={{ background: "#eff6ff", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: 0 }}>
                📋 Created <strong>"{item.title}"</strong>
                <span style={{ color: "#888", fontSize: 13 }}> — {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}</span>
              </p>
              {item.description && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#555" }}>{item.description}</p>}
            </div>
          )}
        </div>
      ))}
    </div>  
  ); 
}      
  