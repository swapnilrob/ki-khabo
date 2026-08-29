import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import {
  getPlans,
  createCheckout,
  verifyCheckout,
  getSubscriptionStatus,
  getSubscriptionHistory,
  cancelSubscription,
} from "../api/subscription";
import "./Subscription.css";

export default function Subscription() {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [plans, setPlans] = useState(null);
  const [features, setFeatures] = useState({ free: [], premium: [] });
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  // Load plans, status, history
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

  // Handle Stripe redirect back with session_id
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");

    if (success === "true" && sessionId) {
      setSubmitting(true);
      verifyCheckout(sessionId)
        .then((result) => {
          setConfirmation(result.subscription);
          updateUser({
            ...user,
            isPremium: true,
            premiumExpiry: result.subscription.endDate,
            subscriptionPlan: result.subscription.plan,
          });
          return Promise.all([
            getSubscriptionStatus(),
            getSubscriptionHistory(),
          ]);
        })
        .then(([statusData, historyData]) => {
          setStatus(statusData);
          setHistory(historyData.subscriptions || []);
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Failed to verify payment");
        })
        .finally(() => {
          setSubmitting(false);
          // Clean up URL params
          setSearchParams({});
        });
    }

    if (searchParams.get("cancelled") === "true") {
      setError("Payment was cancelled. You can try again anytime.");
      setSearchParams({});
    }
  }, [searchParams]);

  const handleCheckout = async () => {
    setError("");
    setSubmitting(true);
    try {
      const result = await createCheckout(selectedPlan);
      // Redirect to Stripe Checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start checkout");
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

      {/* ── Verifying payment spinner ── */}
      {submitting && !confirmation && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--kk-text-secondary)" }}>
          <p style={{ fontSize: 18 }}>⏳ Verifying your payment...</p>
          <p style={{ fontSize: 13 }}>Please wait, do not close this page.</p>
        </div>
      )}

      {/* ── Confirmation ── */}
      {confirmation && (
        <div className="kk-sub-confirm">
          <span className="kk-sub-confirm__icon">🎉</span>
          <h3 className="kk-sub-confirm__title">Payment Successful!</h3>
          <p className="kk-sub-confirm__detail">
            Plan: {confirmation.plan === "monthly" ? "Monthly" : "Yearly"} · ৳{confirmation.amount}
          </p>
          <p className="kk-sub-confirm__detail">
            Valid until: {new Date(confirmation.endDate).toLocaleDateString()}
          </p>
          <p className="kk-sub-confirm__detail">
            Payment: Stripe (Test Mode)
          </p>
          <p className="kk-sub-confirm__detail">
            Transaction: {confirmation.transactionId?.substring(0, 30)}...
          </p>
        </div>
      )}

      {/* ── Active subscription ── */}
      {status?.isPremium && status?.activeSubscription && !confirmation && !submitting && (
        <div className="kk-sub-active">
          <span className="kk-sub-active__label">Active Subscription</span>
          <h3 className="kk-sub-active__plan">
            ⭐ Premium {status.activeSubscription.plan === "monthly" ? "Monthly" : "Yearly"}
          </h3>
          <p style={{ fontSize: 14, color: "var(--kk-text-secondary)", margin: "4px 0" }}>
            Valid until: {new Date(status.activeSubscription.endDate).toLocaleDateString()}
          </p>
          <p style={{ fontSize: 13, color: "var(--kk-text-muted)", margin: "2px 0", fontFamily: "var(--kk-font-mono)" }}>
            Paid via: {status.activeSubscription.paymentMethod === "stripe" ? "Stripe" : status.activeSubscription.paymentMethod}
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

      {/* ── Plan selection ── */}
      {!status?.isPremium && plans && !submitting && (
        <>
          <div className="kk-sub-plans">
            <div
              className={`kk-sub-card ${selectedPlan === "monthly" ? "kk-sub-card--selected" : ""}`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <p className="kk-sub-card__plan">Monthly</p>
              <p className="kk-sub-card__price">
                ৳{plans.monthly.price} <small>/month</small>
              </p>
              <ul className="kk-sub-features">
                {features.premium.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>

            <div
              className={`kk-sub-card ${selectedPlan === "yearly" ? "kk-sub-card--selected" : ""}`}
              onClick={() => setSelectedPlan("yearly")}
            >
              {plans.yearly.savings > 0 && (
                <span className="kk-sub-card__badge">Save ৳{plans.yearly.savings}/year</span>
              )}
              <p className="kk-sub-card__plan">Yearly</p>
              <p className="kk-sub-card__price">
                ৳{plans.yearly.price} <small>/year</small>
              </p>
              <ul className="kk-sub-features">
                {features.premium.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </div>

          {/* Stripe checkout button */}
          <div className="kk-sub-payment">
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>
              Secure Payment via Stripe
            </h3>
            <p style={{ fontSize: 13, color: "var(--kk-text-muted)", margin: "0 0 16px" }}>
              You'll be redirected to Stripe's secure checkout page to complete your payment.
              Use test card: <strong style={{ fontFamily: "var(--kk-font-mono)" }}>4242 4242 4242 4242</strong>
            </p>

            {error && (
              <div className="kk-error" style={{ marginBottom: 12 }}>{error}</div>
            )}

            <button
              className="kk-btn kk-btn--primary"
              style={{ width: "100%", fontSize: 15, padding: "12px 24px" }}
              onClick={handleCheckout}
              disabled={submitting}
            >
              {submitting
                ? "Redirecting to Stripe…"
                : `💳 Pay ৳${plans[selectedPlan]?.price} with Stripe`}
            </button>
          </div>
        </>
      )}

      {/* ── Free plan ── */}
      {!status?.isPremium && features.free.length > 0 && !submitting && (
        <div style={{ marginTop: 24, padding: 20, background: "var(--kk-bg)", borderRadius: "var(--kk-radius)", border: "1px solid var(--kk-border)" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600 }}>
            Free Plan (Current)
          </h4>
          <ul className="kk-sub-features">
            {features.free.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}

      {/* ── Payment History ── */}
      {history.length > 0 && (
        <div className="kk-sub-history">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Payment History</h3>
          <div style={{ background: "var(--kk-white)", borderRadius: "var(--kk-radius)", border: "1px solid var(--kk-border)" }}>
            {history.map((sub) => (
              <div key={sub._id} className="kk-sub-history__item">
                <div>
                  <strong style={{ fontSize: 14 }}>
                    {sub.plan === "monthly" ? "Monthly" : "Yearly"} Premium
                  </strong>
                  <p style={{ fontSize: 12, color: "var(--kk-text-muted)", margin: "2px 0 0", fontFamily: "var(--kk-font-mono)" }}>
                    {sub.paymentMethod === "stripe" ? "Stripe" : sub.paymentMethod} · {new Date(sub.createdAt).toLocaleDateString()}
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