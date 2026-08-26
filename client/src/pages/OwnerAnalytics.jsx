import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui";
import {
  fetchMenuOverview,
  fetchDishRankings,
  fetchRatingTrend,
  fetchReviewSummary,
} from "../api/analytics";
import StarRating from "../components/StarRating";

export default function OwnerAnalytics() {
  const [overview, setOverview] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [trend, setTrend] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchMenuOverview(),
      fetchDishRankings(),
      fetchRatingTrend(),
      fetchReviewSummary(),
    ])
      .then(([ov, rk, tr, rs]) => {
        setOverview(ov.overview);
        setRankings(rk.rankings);
        setTrend(tr.trend);
        setReviewSummary(rs.summary);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><p style={{ padding: 24, color: "var(--kk-text-muted)" }}>Loading analytics…</p></AppLayout>;
  if (error) return <AppLayout><p className="error" style={{ margin: 24 }}>{error}</p></AppLayout>;

  const ov = overview;
  const rs = reviewSummary;

  return (
    <AppLayout>
      <h2 className="kk-page-title">Restaurant Analytics</h2>
      <p className="kk-page-subtitle">Menu performance, ratings, and review insights</p>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <Card compact style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--kk-orange)" }}>{ov?.totalDishes || 0}</div>
          <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "uppercase" }}>Total Dishes</div>
        </Card>
        <Card compact style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--kk-green)" }}>{ov?.available || 0}</div>
          <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "uppercase" }}>Available</div>
        </Card>
        <Card compact style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--kk-red)" }}>{ov?.unavailable || 0}</div>
          <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "uppercase" }}>Hidden</div>
        </Card>
        <Card compact style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>৳{ov?.avgPrice || 0}</div>
          <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "uppercase" }}>Avg Price</div>
        </Card>
        <Card compact style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{ov?.avgCalories || 0}</div>
          <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "uppercase" }}>Avg kcal</div>
        </Card>
        <Card compact style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--kk-blue)" }}>{rs?.totalReviews || 0}</div>
          <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "uppercase" }}>Total Reviews</div>
        </Card>
      </div>

      {/* ── Review summary ── */}
      {rs && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Review Summary</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <StarRating value={rs.avgRating} size={20} />
            <span style={{ fontSize: 22, fontWeight: 700 }}>{rs.avgRating}</span>
            <span style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>from {rs.totalReviews} reviews</span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14 }}>
            <span>🏪 Restaurant reviews: <strong>{rs.restaurantReviews}</strong></span>
            <span>🍽️ Dish reviews: <strong>{rs.dishReviews}</strong></span>
            <span style={{ color: "var(--kk-green)" }}>✅ Responded: <strong>{rs.responded}</strong></span>
            <span style={{ color: "var(--kk-orange)" }}>⏳ Awaiting response: <strong>{rs.awaitingResponse}</strong></span>
          </div>

          {/* Star distribution bar */}
          <div style={{ marginTop: 16 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = rs.starDistribution?.[star] || 0;
              const pct = rs.totalReviews > 0 ? (count / rs.totalReviews) * 100 : 0;
              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 20, textAlign: "right", fontSize: 13, fontWeight: 600 }}>{star}★</span>
                  <div style={{ flex: 1, height: 14, background: "var(--kk-border-light)", borderRadius: 7, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: star >= 4 ? "var(--kk-green)" : star === 3 ? "var(--kk-orange)" : "var(--kk-red)", borderRadius: 7, transition: "width 0.4s" }} />
                  </div>
                  <span style={{ width: 30, fontSize: 12, color: "var(--kk-text-muted)" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Category breakdown ── */}
      {ov?.categoryBreakdown?.length > 0 && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Menu by Category</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {ov.categoryBreakdown.map((cat) => (
              <div key={cat.category} style={{
                padding: "12px 18px", borderRadius: "var(--kk-radius-sm)",
                background: "var(--kk-bg)", textAlign: "center", minWidth: 100,
              }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{cat.count}</div>
                <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "capitalize" }}>{cat.category}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Price distribution ── */}
      {ov?.priceRanges && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Price Distribution</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {ov.priceRanges.map((pr) => (
              <div key={pr.range} style={{
                padding: "12px 18px", borderRadius: "var(--kk-radius-sm)",
                background: "var(--kk-bg)", textAlign: "center", minWidth: 100,
              }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{pr.count}</div>
                <div style={{ fontSize: 12, color: "var(--kk-text-muted)" }}>{pr.range}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Rating trend ── */}
      {trend.length > 0 && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Rating Trend (Monthly)</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {trend.map((t) => (
              <div key={t.month} style={{
                padding: "10px 16px", borderRadius: "var(--kk-radius-sm)",
                background: "var(--kk-bg)", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.avgRating >= 4 ? "var(--kk-green)" : t.avgRating >= 3 ? "var(--kk-orange)" : "var(--kk-red)" }}>
                  {t.avgRating}★
                </div>
                <div style={{ fontSize: 11, color: "var(--kk-text-muted)" }}>{t.month}</div>
                <div style={{ fontSize: 11, color: "var(--kk-text-muted)" }}>{t.reviewCount} reviews</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Top rated dishes ── */}
      {rankings?.topRated?.length > 0 && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Top Rated Dishes</h3>
          {rankings.topRated.map((d, i) => (
            <div key={d.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < rankings.topRated.length - 1 ? "1px solid var(--kk-border-light)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, color: "var(--kk-text-muted)", width: 24 }}>#{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                  <small style={{ color: "var(--kk-text-muted)" }}>{d.category} · ৳{d.price} · {d.calories} kcal</small>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StarRating value={d.averageRating} size={14} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{d.averageRating}</span>
                <span style={{ color: "var(--kk-text-muted)", fontSize: 12 }}>({d.totalReviews})</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Most reviewed ── */}
      {rankings?.mostReviewed?.length > 0 && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Most Reviewed Dishes</h3>
          {rankings.mostReviewed.map((d, i) => (
            <div key={d.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < rankings.mostReviewed.length - 1 ? "1px solid var(--kk-border-light)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, color: "var(--kk-text-muted)", width: 24 }}>#{i + 1}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>{d.totalReviews} reviews</span>
                <StarRating value={d.averageRating} size={14} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Lowest rated — needs attention ── */}
      {rankings?.lowestRated?.length > 0 && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: "var(--kk-red)" }}>⚠️ Needs Attention</h3>
          <p style={{ fontSize: 13, color: "var(--kk-text-muted)", marginBottom: 12 }}>Lowest-rated dishes — consider updating these based on customer feedback.</p>
          {rankings.lowestRated.map((d) => (
            <div key={d.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid var(--kk-border-light)",
            }}>
              <span style={{ fontSize: 14 }}>{d.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StarRating value={d.averageRating} size={14} />
                <span style={{ color: "var(--kk-red)", fontWeight: 600 }}>{d.averageRating}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Placeholder for order analytics ── */}
      <Card style={{ textAlign: "center", padding: "32px 24px", color: "var(--kk-text-muted)" }}>
        📊 Order analytics (total orders, best sellers, revenue trends) will appear here once the Order & Booking module is live.
      </Card>
    </AppLayout>
  );
}