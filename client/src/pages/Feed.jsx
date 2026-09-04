import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFeed, searchUsers, followUser, unfollowUser, getFollowStatus } from "../api/community";
import StarRating from "../components/StarRating";
import AppLayout from "../components/AppLayout";
import { Card, Badge } from "../components/ui";
import "./Feed.css";

export default function Feed() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // User search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [followState, setFollowState] = useState({});

  const loadFeed = useCallback(() => {
    setLoading(true);
    getFeed()
      .then((data) => { setFeed(data.feed); setMessage(data.message || ""); })
      .catch(() => setMessage("Could not load feed."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const data = await searchUsers(query);
      setResults(data.users);
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
        loadFeed();
      }
    } catch (err) { console.error(err.response?.data?.message); }
  };

  const sidebar = (
    <div className="feed-sidebar">
      <Card className="feed-search-card">
        <h3 className="feed-search-title">Find people</h3>
        <div className="feed-search-row">
          <input
            className="kk-input"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={handleSearch} disabled={searching}>
            {searching ? "..." : "Search"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="feed-search-results">
            {results.map((u) => (
              <div key={u.id} className="feed-search-user">
                <div className="feed-avatar feed-avatar--sm">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="feed-search-user-info">
                  <span className="feed-search-user-name">{u.name}</span>
                  <span className="feed-search-user-email">{u.email}</span>
                </div>
                <button
                  className={`kk-btn kk-btn--sm ${followState[u.id] ? "kk-btn--ghost" : "kk-btn--secondary"}`}
                  onClick={() => toggleFollow(u.id)}
                >
                  {followState[u.id] ? "Unfollow" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="feed-nav-card">
        <h3 className="feed-search-title">Community</h3>
        <button className="feed-nav-link" onClick={() => navigate("/saved-dishes")}>
          <span>&#10084;&#65039;</span> Saved Dishes
        </button>
        <button className="feed-nav-link" onClick={() => navigate("/food-lists")}>
          <span>&#128221;</span> Food Lists
        </button>
        <button className="feed-nav-link" onClick={() => navigate("/app")}>
          <span>&#127968;</span> Dashboard
        </button>
      </Card>
    </div>
  );

  return (
    <AppLayout sidebar={sidebar}>
      <h2 className="kk-page-title">Community Feed</h2>
      <p className="kk-page-subtitle">See what people you follow are eating and reviewing</p>

      {loading ? (
        <Card className="feed-empty">Loading feed...</Card>
      ) : feed.length === 0 ? (
        <Card className="feed-empty">
          {message || "Your feed is empty. Follow some people to see their activity here."}
        </Card>
      ) : (
        <div className="feed-list">
          {feed.map((item, idx) => (
            <Card key={item.id || idx} className="feed-item">
              {/* Header */}
              <div className="feed-item-header">
                <div className="feed-avatar">
                  {(item.user?.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="feed-item-meta">
                  <span className="feed-item-user">{item.user?.name || "Someone"}</span>
                  <span className="feed-item-time">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <Badge variant={
                  item.activityType === "review" ? "default" :
                  item.activityType === "saved_dish" ? "success" : "info"
                }>
                  {item.activityType === "review" ? "Review" :
                   item.activityType === "saved_dish" ? "Saved" : "List"}
                </Badge>
              </div>

              {/* Review card */}
              {item.activityType === "review" && (
                <div className="feed-activity feed-activity--review">
                  <div className="feed-activity-top">
                    <StarRating value={item.rating} size={16} />
                    {item.targetType === "dish" && item.dish?.name && (
                      <span className="feed-dish-name">{item.dish.name}</span>
                    )}
                  </div>
                  {item.comment && (
                    <p className="feed-comment">{item.comment}</p>
                  )}
                  {item.restaurant && (
                    <button
                      className="feed-restaurant-link"
                      onClick={() => navigate(`/restaurant/${item.restaurant._id || item.restaurant.id || item.restaurant}`)}
                    >
                      {item.restaurant.businessName || "View restaurant"}
                      {item.restaurant.city ? ` \u00B7 ${item.restaurant.city}` : ""}
                      {" \u2192"}
                    </button>
                  )}
                </div>
              )}

              {/* Saved dish card */}
              {item.activityType === "saved_dish" && (
                <div className="feed-activity feed-activity--saved">
                  <p className="feed-activity-text">
                    Saved <strong>{item.dish?.name || "a dish"}</strong>
                    {item.dish?.price != null && (
                      <span className="feed-price"> — &#2547;{item.dish.price}</span>
                    )}
                  </p>
                  <p className="feed-collection">
                    Collection: {item.collectionName || "Favorites"}
                  </p>
                </div>
              )}

              {/* Food list card */}
              {item.activityType === "food_list" && (
                <div className="feed-activity feed-activity--list">
                  <p className="feed-activity-text">
                    Created <strong>"{item.title}"</strong>
                    <span className="feed-item-count">
                      {" "} — {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
                    </span>
                  </p>
                  {item.description && (
                    <p className="feed-list-desc">{item.description}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}