import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2>Register your restaurant</h2>
        <p>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        {error && <p className="error">{error}</p>}

        {step === 0 && (
          <>
            <input name="name" placeholder="Your full name" value={form.name} onChange={handleChange} />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            <input name="password" type="password" placeholder="Password (min 6)" value={form.password} onChange={handleChange} />
          </>
        )}

        {step === 1 && (
          <>
            <input name="businessName" placeholder="Business name" value={form.businessName} onChange={handleChange} />
            <input name="tradeLicenseNo" placeholder="Trade license number" value={form.tradeLicenseNo} onChange={handleChange} />
            <input name="cuisineTypes" placeholder="Cuisines (comma separated)" value={form.cuisineTypes} onChange={handleChange} />
            <select name="priceRange" value={form.priceRange} onChange={handleChange}>
              <option value="$">$ Budget</option>
              <option value="$$">$$ Mid-range</option>
              <option value="$$$">$$$ Premium</option>
            </select>
          </>
        )}

        {step === 2 && (
          <>
            <input name="address" placeholder="Street address" value={form.address} onChange={handleChange} />
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
            <input name="restaurantPhone" placeholder="Restaurant phone" value={form.restaurantPhone} onChange={handleChange} />
            <input name="openingHours" placeholder="e.g. 11:00 AM - 11:00 PM" value={form.openingHours} onChange={handleChange} />
          </>
        )}

        <div className="row">
          {step > 0 && <button type="button" onClick={back}>Back</button>}
          {step < STEPS.length - 1
            ? <button type="button" onClick={next}>Next</button>
            : <button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for verification"}</button>}
        </div>

        <p>Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}