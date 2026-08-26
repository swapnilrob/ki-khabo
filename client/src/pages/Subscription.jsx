import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import {
  getPlans,
  subscribe,
  getSubscriptionStatus,
  getSubscriptionHistory,
  cancelSubscription,
} from "../api/subscription";
import "./Subscription.css";

export default function Subscription() {
  const { user, updateUser } = useAuth();

  const [plans, setPlans] = useState(null);
  const [features, setFeatures] = useState({ free: [], premium: [] });
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [planData, statusData, historyData] = await Promise.all([
          getPlans(),
          getSubscriptionStatus(),
          getSubscriptionHistory(),
        ]);
        setPlans(planData.plans);
        setFeatures(planData.features);
        setStatus(statusData);
        setHistory(historyData.subscriptions || []);
      } catch (err) {
        console.error("Failed to load subscription data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubscribe = async () => {
    setError("");

    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }
    if (paymentMethod === "bkash" && !paymentNumber.trim()) {
      setError("Please enter your bKash number");
      return;
    }

    setSubmitting(true);
    try {
      const result = await subscribe({
        plan: selectedPlan,
        paymentMethod,
        paymentNumber: paymentNumber.trim(),
      });

      setConfirmation(result.subscription);

      // Update user in AuthContext
      updateUser({
        ...user,
        isPremium: true,
        premiumExpiry: result.subscription.endDate,
        subscriptionPlan: result.subscription.plan,
      });

      // Refresh status and history
      const [statusData, historyData] = await Promise.all([
        getSubscriptionStatus(),
        getSubscriptionHistory(),
      ]);
      setStatus(statusData);
      setHistory(historyData.subscriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your premium subscription?")) return;

    try {
      await cancelSubscription();
      updateUser({
        ...user,
        isPremium: false,
        premiumExpiry: null,
        subscriptionPlan: null,
      });
      setStatus({ isPremium: false, activeSubscription: null });
      setConfirmation(null);

      const historyData = await getSubscriptionHistory();
      setHistory(historyData.subscriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel subscription");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <p style={{ padding: 24, color: "var(--kk-text-muted)" }}>Loading subscription info…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link to="/app" style={{ color: "var(--kk-text-secondary)", fontSize: 14 }}>
        ← Back to Dashboard
      </Link>

      <h2 className="kk-page-title" style={{ marginTop: 8 }}>
        Subscription & Premium
      </h2>
      <p className="kk-page-subtitle">
        Unlock AI-powered features with Ki Khabo Premium
      </p>

      {/* ── Confirmation after successful payment ── */}
      {confirmation && (
        <div className="kk-sub-confirm">
          <span className="kk-sub-confirm__icon">🎉</span>
          <h3 className="kk-sub-confirm__title">Payment Successful!</h3>
          <p className="kk-sub-confirm__detail">
            Transaction ID: {confirmation.transactionId}
          </p>
          <p className="kk-sub-confirm__detail">
            Plan: {confirmation.plan} · ৳{confirmation.amount}
          </p>
          <p className="kk-sub-confirm__detail">
            Valid until: {new Date(confirmation.endDate).toLocaleDateString()}
          </p>
          <p className="kk-sub-confirm__detail">
            Payment: {confirmation.paymentMethod === "bkash" ? "bKash" : "SSLCommerz"}
          </p>
        </div>
      )}

      {/* ── Active subscription banner ── */}
      {status?.isPremium && status?.activeSubscription && !confirmation && (
        <div className="kk-sub-active">
          <span className="kk-sub-active__label">Active Subscription</span>
          <h3 className="kk-sub-active__plan">
            ⭐ Premium {status.activeSubscription.plan === "monthly" ? "Monthly" : "Yearly"}
          </h3>
          <p style={{ fontSize: 14, color: "var(--kk-text-secondary)", margin: "4px 0" }}>
            Valid until: {new Date(status.activeSubscription.endDate).toLocaleDateString()}
          </p>
          <p style={{ fontSize: 13, color: "var(--kk-text-muted)", margin: "2px 0", fontFamily: "var(--kk-font-mono)" }}>
            Transaction: {status.activeSubscription.transactionId}
          </p>
          <button
            className="kk-btn kk-btn--danger kk-btn--sm"
            style={{ marginTop: 12 }}
            onClick={handleCancel}
          >
            Cancel subscription
          </button>
        </div>
      )}

      {/* ── Plan selection (only when not premium) ── */}
      {!status?.isPremium && plans && (
        <>
          <div className="kk-sub-plans">
            {/* Monthly card */}
            <div
              className={`kk-sub-card ${selectedPlan === "monthly" ? "kk-sub-card--selected" : ""}`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <p className="kk-sub-card__plan">Monthly</p>
              <p className="kk-sub-card__price">
                ৳{plans.monthly.price} <small>/month</small>
              </p>
              <ul className="kk-sub-features">
                {features.premium.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Yearly card */}
            <div
              className={`kk-sub-card ${selectedPlan === "yearly" ? "kk-sub-card--selected" : ""}`}
              onClick={() => setSelectedPlan("yearly")}
            >
              {plans.yearly.savings > 0 && (
                <span className="kk-sub-card__badge">
                  Save ৳{plans.yearly.savings}/year
                </span>
              )}
              <p className="kk-sub-card__plan">Yearly</p>
              <p className="kk-sub-card__price">
                ৳{plans.yearly.price} <small>/year</small>
              </p>
              <ul className="kk-sub-features">
                {features.premium.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment section */}
          <div className="kk-sub-payment">
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>
              Payment Method
            </h3>
            <p style={{ fontSize: 13, color: "var(--kk-text-muted)", margin: 0 }}>
              Select how you'd like to pay
            </p>

            <div className="kk-sub-payment__methods">
              <button
                className={`kk-sub-payment__method ${paymentMethod === "bkash" ? "kk-sub-payment__method--selected" : ""}`}
                onClick={() => setPaymentMethod("bkash")}
              >
                📱 bKash
              </button>
              <button
                className={`kk-sub-payment__method ${paymentMethod === "sslcommerz" ? "kk-sub-payment__method--selected" : ""}`}
                onClick={() => setPaymentMethod("sslcommerz")}
              >
                💳 SSLCommerz
              </button>
            </div>

            {paymentMethod === "bkash" && (
              <div className="kk-input-group" style={{ marginTop: 12 }}>
                <label>bKash Account Number</label>
                <input
                  className="kk-input"
                  type="tel"
                  placeholder="e.g. 01XXXXXXXXX"
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                />
              </div>
            )}

            {paymentMethod === "sslcommerz" && (
              <p style={{ fontSize: 13, color: "var(--kk-text-secondary)", marginTop: 12 }}>
                You will be redirected to SSLCommerz secure payment gateway. (Simulated for demo)
              </p>
            )}

            {error && (
              <div className="kk-error" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}

            <button
              className="kk-btn kk-btn--primary"
              style={{ marginTop: 16, width: "100%" }}
              onClick={handleSubscribe}
              disabled={submitting}
            >
              {submitting
                ? "Processing payment…"
                : `Pay ৳${plans[selectedPlan]?.price} — Activate Premium`}
            </button>
          </div>
        </>
      )}

      {/* ── Free plan features ── */}
      {!status?.isPremium && features.free.length > 0 && (
        <div style={{ marginTop: 24, padding: 20, background: "var(--kk-bg)", borderRadius: "var(--kk-radius)", border: "1px solid var(--kk-border)" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600 }}>
            Free Plan (Current)
          </h4>
          <ul className="kk-sub-features">
            {features.free.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Payment History ── */}
      {history.length > 0 && (
        <div className="kk-sub-history">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Payment History
          </h3>
          <div style={{ background: "var(--kk-white)", borderRadius: "var(--kk-radius)", border: "1px solid var(--kk-border)" }}>
            {history.map((sub) => (
              <div key={sub._id} className="kk-sub-history__item">
                <div>
                  <strong style={{ fontSize: 14 }}>
                    {sub.plan === "monthly" ? "Monthly" : "Yearly"} Premium
                  </strong>
                  <p style={{ fontSize: 12, color: "var(--kk-text-muted)", margin: "2px 0 0", fontFamily: "var(--kk-font-mono)" }}>
                    {sub.transactionId} · {sub.paymentMethod === "bkash" ? "bKash" : "SSLCommerz"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: 14 }}>৳{sub.amount}</strong>
                  <p className={`kk-sub-status--${sub.status}`} style={{ fontSize: 12, margin: "2px 0 0" }}>
                    {sub.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
} 