import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getRewards, redeemPoints } from "../api/rewards";
import "./Rewards.css";

const ACTION_LABELS = {
  review_written: "📝 Review Written",
  subscription_purchased: "⭐ Subscription Purchased",
  subscription_renewed: "🔄 Subscription Renewed",
  meal_plan_completed: "📋 Meal Plan Completed",
  points_redeemed: "🎁 Points Redeemed",
};

export default function Rewards() {
  const { user, updateUser } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeemErr, setRedeemErr] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const load = async () => {
    try {
      const res = await getRewards();
      setData(res);
    } catch (err) {
      console.error("Failed to load rewards", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRedeem = async () => {
    setRedeemErr("");
    setRedeemMsg("");

    const points = parseInt(redeemAmount);
    if (!points || points <= 0) {
      setRedeemErr("Enter a valid number of points");
      return;
    }

    setRedeeming(true);
    try {
      const res = await redeemPoints(points);
      setRedeemMsg(res.message);
      setRedeemAmount("");
      updateUser({ ...user, rewardPoints: res.remainingPoints });
      load();
    } catch (err) {
      setRedeemErr(err.response?.data?.message || "Redemption failed");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <p style={{ padding: 24, color: "var(--kk-text-muted)" }}>Loading rewards…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link to="/app" style={{ color: "var(--kk-text-secondary)", fontSize: 14 }}>
        ← Back to Dashboard
      </Link>

      <h2 className="kk-page-title" style={{ marginTop: 8 }}>
        Reward Points
      </h2>
      <p className="kk-page-subtitle">
        Earn points through platform activity and redeem them for subscription discounts
      </p>

      {!user?.isPremium && (
        <div style={{
          marginTop: 16,
          padding: 16,
          borderRadius: "var(--kk-radius-sm)",
          background: "var(--kk-orange-light)",
          border: "1px solid var(--kk-orange)",
          fontSize: 14,
        }}>
          ⭐ Reward points are earned by <strong>Premium members only</strong>.{" "}
          <Link to="/app/subscription" style={{ color: "var(--kk-orange)", fontWeight: 600 }}>
            Upgrade to Premium
          </Link>
        </div>
      )}

      {/* Summary cards */}
      <div className="kk-rewards-summary">
        <div className="kk-rewards-stat">
          <span className="kk-rewards-stat__value">{data?.rewardPoints || 0}</span>
          <span className="kk-rewards-stat__label">Total Points</span>
        </div>
        <div className="kk-rewards-stat">
          <span className="kk-rewards-stat__value">৳{data?.discountValue || 0}</span>
          <span className="kk-rewards-stat__label">Discount Available</span>
        </div>
        <div className="kk-rewards-stat">
          <span className="kk-rewards-stat__value">{data?.pointsPerTaka || 20}</span>
          <span className="kk-rewards-stat__label">Points per ৳1</span>
        </div>
      </div>

      {/* How to earn */}
      <div className="kk-rewards-earn">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>How to Earn Points</h3>
        <p style={{ fontSize: 13, color: "var(--kk-text-muted)", margin: "4px 0 0" }}>
          Complete these actions to earn reward points (Premium only)
        </p>
        <div className="kk-rewards-earn__grid">
          {data?.pointsTable && Object.entries(data.pointsTable).map(([action, points]) => (
            <div key={action} className="kk-rewards-earn__item">
              <span className="kk-rewards-earn__action">
                {ACTION_LABELS[action] || action}
              </span>
              <span className="kk-rewards-earn__points">+{points} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem section */}
      {user?.isPremium && data?.rewardPoints > 0 && (
        <div className="kk-rewards-redeem">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Redeem Points for Discount
          </h3>
          <p style={{ fontSize: 13, color: "var(--kk-text-secondary)", margin: "4px 0 12px" }}>
            Convert your points into a discount on your next subscription renewal.
            {data.pointsPerTaka} points = ৳1 discount.
          </p>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div className="kk-input-group" style={{ flex: 1, margin: 0 }}>
              <input
                className="kk-input"
                type="number"
                placeholder={`Points to redeem (max ${data.rewardPoints})`}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                max={data.rewardPoints}
              />
            </div>
            <button
              className="kk-btn kk-btn--primary"
              onClick={handleRedeem}
              disabled={redeeming}
            >
              {redeeming ? "Redeeming…" : "Redeem"}
            </button>
          </div>

          {redeemAmount > 0 && (
            <p style={{ fontSize: 13, color: "var(--kk-text-secondary)", marginTop: 8 }}>
              = ৳{Math.floor(parseInt(redeemAmount) / data.pointsPerTaka) || 0} discount
            </p>
          )}

          {redeemMsg && (
            <p style={{ color: "var(--kk-green)", fontSize: 14, marginTop: 10, fontWeight: 600 }}>
              ✓ {redeemMsg}
            </p>
          )}
          {redeemErr && (
            <div className="kk-error" style={{ marginTop: 10 }}>{redeemErr}</div>
          )}
        </div>
      )}

      {/* History */}
      {data?.history?.length > 0 && (
        <div className="kk-rewards-history">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Points History
          </h3>
          <div style={{ background: "var(--kk-white)", borderRadius: "var(--kk-radius)", border: "1px solid var(--kk-border)" }}>
            {data.history.map((item) => (
              <div key={item._id} className="kk-rewards-history__item">
                <div>
                  <strong>{ACTION_LABELS[item.action] || item.action}</strong>
                  <p style={{ fontSize: 12, color: "var(--kk-text-muted)", margin: "2px 0 0" }}>
                    {item.description} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={item.points > 0 ? "kk-rewards-points--positive" : "kk-rewards-points--negative"}>
                  {item.points > 0 ? `+${item.points}` : item.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
} 