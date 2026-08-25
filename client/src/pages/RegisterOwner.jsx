import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../components/AuthStyles.css";

const STEPS = ["Account", "Business", "Location"];

export default function RegisterOwner() {
  const { registerOwner } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    businessName: "", tradeLicenseNo: "", cuisineTypes: "", priceRange: "$$",
    address: "", city: "", restaurantPhone: "", openingHours: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await registerOwner({
        ...form,
        cuisineTypes: form.cuisineTypes.split(",").map((c) => c.trim()).filter(Boolean),
      });
      navigate("/owner");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kk-app">
      <Navbar />
      <div className="kk-auth-page">
        <div className="kk-auth-card">
          <h2>Register your restaurant</h2>
          <p className="kk-auth-step">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>

          {error && <div className="kk-error">{error}</div>}

          {step === 0 && (
            <>
              <div className="kk-input-group">
                <label>Full name</label>
                <input name="name" className="kk-input" placeholder="Your full name" value={form.name} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Email</label>
                <input name="email" type="email" className="kk-input" placeholder="you@example.com" value={form.email} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Phone</label>
                <input name="phone" className="kk-input" placeholder="01XXXXXXXXX" value={form.phone} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Password</label>
                <input name="password" type="password" className="kk-input" placeholder="At least 6 characters" value={form.password} onChange={handleChange} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="kk-input-group">
                <label>Business name</label>
                <input name="businessName" className="kk-input" placeholder="e.g. Sultan's Dine" value={form.businessName} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Trade license number</label>
                <input name="tradeLicenseNo" className="kk-input" placeholder="TRAD-DHK-2026-XXXX" value={form.tradeLicenseNo} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Cuisines</label>
                <input name="cuisineTypes" className="kk-input" placeholder="Bangladeshi, Mughlai, Chinese" value={form.cuisineTypes} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Price range</label>
                <select name="priceRange" className="kk-input" value={form.priceRange} onChange={handleChange}>
                  <option value="$">$ Budget</option>
                  <option value="$$">$$ Mid-range</option>
                  <option value="$$$">$$$ Premium</option>
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="kk-input-group">
                <label>Street address</label>
                <input name="address" className="kk-input" placeholder="House/Road, Area" value={form.address} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>City</label>
                <input name="city" className="kk-input" placeholder="Dhaka" value={form.city} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Restaurant phone</label>
                <input name="restaurantPhone" className="kk-input" placeholder="Restaurant contact number" value={form.restaurantPhone} onChange={handleChange} />
              </div>
              <div className="kk-input-group">
                <label>Opening hours</label>
                <input name="openingHours" className="kk-input" placeholder="e.g. 11:00 AM - 11:00 PM" value={form.openingHours} onChange={handleChange} />
              </div>
            </>
          )}

          <div className="kk-auth-row">
            {step > 0 && (
              <button className="kk-btn kk-btn--outline" type="button" onClick={back}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="kk-btn kk-btn--primary" type="button" onClick={next}>
                Next
              </button>
            ) : (
              <button
                className="kk-btn kk-btn--primary"
                onClick={handleSubmit}
                disabled={busy}
              >
                {busy ? "Submitting…" : "Submit for verification"}
              </button>
            )}
          </div>

          <div className="kk-auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
