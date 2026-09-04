import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui";
import {
  fetchMenuOverview, fetchDishRankings, fetchRatingTrend, fetchReviewSummary,
  fetchOrderOverview, fetchBestSellers, fetchRevenueTrend,
} from "../api/analytics";
import StarRating from "../components/StarRating";

const STATUS_COLORS = {
  pending: "var(--kk-orange)", approved: "var(--kk-blue)", completed: "var(--kk-green)",
  rejected: "var(--kk-red)", cancelled: "var(--kk-text-muted)", rescheduled: "var(--kk-blue)",
};

export default function OwnerAnalytics() {
  const [overview, setOverview] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [trend, setTrend] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [orderOverview, setOrderOverview] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchMenuOverview(), fetchDishRankings(), fetchRatingTrend(), fetchReviewSummary(),
      fetchOrderOverview(), fetchBestSellers(), fetchRevenueTrend(),
    ])
      .then(([ov, rk, tr, rs, oo, bs, rv]) => {
        setOverview(ov.overview); setRankings(rk.rankings); setTrend(tr.trend); setReviewSummary(rs.summary);
        setOrderOverview(oo.orderOverview); setBestSellers(bs.bestSellers || []); setRevenueTrend(rv.revenueTrend || []);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><p style={{ padding: 24, color: "var(--kk-text-muted)" }}>Loading analytics...</p></AppLayout>;
  if (error) return <AppLayout><div style={{ background: "var(--kk-red-light)", color: "var(--kk-red)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", margin: 24, fontSize: 13 }}>{error}</div></AppLayout>;

  const ov = overview;
  const rs = reviewSummary;
  const oo = orderOverview;

  return (
    <AppLayout>
      <h2 className="kk-page-title">Restaurant Analytics</h2>
      <p className="kk-page-subtitle">Menu performance, orders, revenue, ratings, and review insights</p>

      {/* ── Top stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "var(--kk-space-3)", marginBottom: "var(--kk-space-6)" }}>
        {[
          { val: ov?.totalDishes || 0, label: "Dishes", color: "var(--kk-orange)" },
          { val: ov?.available || 0, label: "Available", color: "var(--kk-green)" },
          { val: oo?.totalOrders || 0, label: "Orders", color: "var(--kk-blue)" },
          { val: oo?.totalReservations || 0, label: "Reservations", color: "var(--kk-blue)" },
          { val: "৳" + (oo?.totalRevenue || 0), label: "Revenue", color: "var(--kk-green)" },
          { val: "৳" + (oo?.avgOrderValue || 0), label: "Avg Order", color: "var(--kk-text)" },
          { val: rs?.totalReviews || 0, label: "Reviews", color: "var(--kk-orange)" },
          { val: rs?.avgRating || 0, label: "Avg Rating", color: "var(--kk-orange)" },
        ].map((s) => (
          <Card compact key={s.label} style={{ textAlign: "center", padding: "var(--kk-space-4)" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "var(--kk-text-muted)", textTransform: "uppercase", fontFamily: "var(--kk-font-mono)", letterSpacing: "0.04em" }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* ── Order Status Breakdown ── */}
      {oo?.statusBreakdown && Object.keys(oo.statusBreakdown).length > 0 && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Order Status</h3>
          <div style={{ display: "flex", gap: "var(--kk-space-3)", flexWrap: "wrap" }}>
            {Object.entries(oo.statusBreakdown).map(([status, count]) => (
              <div key={status} style={{ padding: "var(--kk-space-3) var(--kk-space-5)", borderRadius: "var(--kk-radius-sm)", background: "var(--kk-bg)", textAlign: "center", minWidth: 100, border: "1px solid var(--kk-border-light)" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: STATUS_COLORS[status] || "var(--kk-text)" }}>{count}</div>
                <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "capitalize" }}>{status}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Revenue Trend ── */}
      {revenueTrend.length > 0 && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Revenue Trend (Monthly)</h3>
          <div style={{ display: "flex", gap: "var(--kk-space-3)", flexWrap: "wrap" }}>
            {revenueTrend.map((t) => (
              <div key={t.month} style={{ padding: "var(--kk-space-3) var(--kk-space-4)", borderRadius: "var(--kk-radius-sm)", background: "var(--kk-bg)", textAlign: "center", border: "1px solid var(--kk-border-light)" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--kk-green)" }}>{"৳" + t.revenue}</div>
                <div style={{ fontSize: 11, color: "var(--kk-text-muted)", fontFamily: "var(--kk-font-mono)" }}>{t.month}</div>
                <div style={{ fontSize: 11, color: "var(--kk-text-muted)" }}>{t.orderCount} orders</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Best Sellers ── */}
      {bestSellers.length > 0 && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Best Selling Dishes</h3>
          {bestSellers.map((d, i) => (
            <div key={d._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--kk-space-3) 0", borderBottom: i < bestSellers.length - 1 ? "1px solid var(--kk-border-light)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, color: "var(--kk-text-muted)", width: 24, fontFamily: "var(--kk-font-mono)" }}>#{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                  <small style={{ color: "var(--kk-text-muted)" }}>{d.orderCount} orders</small>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "var(--kk-green)" }}>{"৳" + d.totalRevenue}</div>
                <small style={{ color: "var(--kk-text-muted)" }}>{d.totalQuantity} sold</small>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Review Summary ── */}
      {rs && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Review Summary</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--kk-space-4)" }}>
            <StarRating value={rs.avgRating} size={20} />
            <span style={{ fontSize: 22, fontWeight: 700 }}>{rs.avgRating}</span>
            <span style={{ color: "var(--kk-text-muted)", fontSize: 13 }}>from {rs.totalReviews} reviews</span>
          </div>
          <div style={{ display: "flex", gap: "var(--kk-space-5)", flexWrap: "wrap", fontSize: 14, marginBottom: "var(--kk-space-4)" }}>
            <span>Restaurant: <strong>{rs.restaurantReviews}</strong></span>
            <span>Dish: <strong>{rs.dishReviews}</strong></span>
            <span style={{ color: "var(--kk-green)" }}>Responded: <strong>{rs.responded}</strong></span>
            <span style={{ color: "var(--kk-orange)" }}>Awaiting: <strong>{rs.awaitingResponse}</strong></span>
          </div>
          <div>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = rs.starDistribution?.[star] || 0;
              const pct = rs.totalReviews > 0 ? (count / rs.totalReviews) * 100 : 0;
              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 20, textAlign: "right", fontSize: 13, fontWeight: 600, fontFamily: "var(--kk-font-mono)" }}>{star}★</span>
                  <div style={{ flex: 1, height: 14, background: "var(--kk-border-light)", borderRadius: 7, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", background: star >= 4 ? "var(--kk-green)" : star === 3 ? "var(--kk-orange)" : "var(--kk-red)", borderRadius: 7, transition: "width 0.4s" }} />
                  </div>
                  <span style={{ width: 30, fontSize: 12, color: "var(--kk-text-muted)", fontFamily: "var(--kk-font-mono)" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Category Breakdown ── */}
      {ov?.categoryBreakdown?.length > 0 && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Menu by Category</h3>
          <div style={{ display: "flex", gap: "var(--kk-space-3)", flexWrap: "wrap" }}>
            {ov.categoryBreakdown.map((cat) => (
              <div key={cat.category} style={{ padding: "var(--kk-space-3) var(--kk-space-5)", borderRadius: "var(--kk-radius-sm)", background: "var(--kk-bg)", textAlign: "center", minWidth: 100, border: "1px solid var(--kk-border-light)" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--kk-orange)" }}>{cat.count}</div>
                <div style={{ fontSize: 12, color: "var(--kk-text-muted)", textTransform: "capitalize" }}>{cat.category}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Price Distribution ── */}
      {ov?.priceRanges && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Price Distribution</h3>
          <div style={{ display: "flex", gap: "var(--kk-space-3)", flexWrap: "wrap" }}>
            {ov.priceRanges.map((pr) => (
              <div key={pr.range} style={{ padding: "var(--kk-space-3) var(--kk-space-5)", borderRadius: "var(--kk-radius-sm)", background: "var(--kk-bg)", textAlign: "center", minWidth: 100, border: "1px solid var(--kk-border-light)" }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{pr.count}</div>
                <div style={{ fontSize: 12, color: "var(--kk-text-muted)" }}>{pr.range}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Rating Trend ── */}
      {trend.length > 0 && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Rating Trend (Monthly)</h3>
          <div style={{ display: "flex", gap: "var(--kk-space-3)", flexWrap: "wrap" }}>
            {trend.map((t) => (
              <div key={t.month} style={{ padding: "var(--kk-space-3) var(--kk-space-4)", borderRadius: "var(--kk-radius-sm)", background: "var(--kk-bg)", textAlign: "center", border: "1px solid var(--kk-border-light)" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.avgRating >= 4 ? "var(--kk-green)" : t.avgRating >= 3 ? "var(--kk-orange)" : "var(--kk-red)" }}>{t.avgRating}★</div>
                <div style={{ fontSize: 11, color: "var(--kk-text-muted)", fontFamily: "var(--kk-font-mono)" }}>{t.month}</div>
                <div style={{ fontSize: 11, color: "var(--kk-text-muted)" }}>{t.reviewCount} reviews</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Top Rated ── */}
      {rankings?.topRated?.length > 0 && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)" }}>Top Rated Dishes</h3>
          {rankings.topRated.map((d, i) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--kk-space-3) 0", borderBottom: i < rankings.topRated.length - 1 ? "1px solid var(--kk-border-light)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, color: "var(--kk-text-muted)", width: 24, fontFamily: "var(--kk-font-mono)" }}>#{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                  <small style={{ color: "var(--kk-text-muted)" }}>{d.category} · {"৳" + d.price} · {d.calories} kcal</small>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StarRating value={d.averageRating} size={14} />
                <span style={{ fontWeight: 600 }}>{d.averageRating}</span>
                <span style={{ color: "var(--kk-text-muted)", fontSize: 12, fontFamily: "var(--kk-font-mono)" }}>({d.totalReviews})</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Needs Attention ── */}
      {rankings?.lowestRated?.length > 0 && (
        <Card style={{ marginBottom: "var(--kk-space-6)", padding: "var(--kk-space-5)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--kk-space-4)", color: "var(--kk-red)" }}>Needs Attention</h3>
          <p style={{ fontSize: 13, color: "var(--kk-text-muted)", marginBottom: "var(--kk-space-3)" }}>Lowest-rated dishes — consider updating based on feedback.</p>
          {rankings.lowestRated.map((d) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--kk-space-2) 0", borderBottom: "1px solid var(--kk-border-light)" }}>
              <span style={{ fontSize: 14 }}>{d.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StarRating value={d.averageRating} size={14} />
                <span style={{ color: "var(--kk-red)", fontWeight: 600 }}>{d.averageRating}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </AppLayout>
  );
}