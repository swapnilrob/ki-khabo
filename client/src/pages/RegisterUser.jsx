import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../components/AuthStyles.css";

export default function RegisterUser() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await registerUser(form);
      navigate("/dashboard");
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
          <h2>Create your account</h2>
          <p className="kk-auth-subtitle">Join Ki Khabo to discover great food</p>

          {error && <div className="kk-error">{error}</div>}

          <div className="kk-input-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name" name="name" className="kk-input"
              placeholder="Your full name"
              value={form.name} onChange={handleChange} required
            />
          </div>

          <div className="kk-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email" className="kk-input"
              placeholder="you@example.com"
              value={form.email} onChange={handleChange} required
            />
          </div>

          <div className="kk-input-group">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone" name="phone" className="kk-input"
              placeholder="01XXXXXXXXX"
              value={form.phone} onChange={handleChange} required
            />
          </div>

          <div className="kk-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" className="kk-input"
              placeholder="At least 6 characters"
              value={form.password} onChange={handleChange} required
            />
          </div>

          <button
            className="kk-btn kk-btn--primary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Creating account…" : "Create account"}
          </button>

          <div className="kk-auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
            {" · "}
            <Link to="/register-owner">Register a restaurant</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
