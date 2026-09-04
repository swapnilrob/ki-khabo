import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../components/AuthStyles.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kk-app">
      <Navbar />
      <div className="kk-auth-page">
        <div className="kk-auth-card">
          <h2>Welcome back</h2>
          <p className="kk-auth-subtitle">Log in to your Ki Khabo account</p>

          {error && <div className="kk-error">{error}</div>}

          <div className="kk-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="kk-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="kk-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="kk-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="kk-btn kk-btn--primary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Logging in…" : "Log in"}
          </button>

          <div className="kk-auth-footer">
            New here? <Link to="/register">Create an account</Link>
            {" · "}
            <Link to="/register-owner">Register a restaurant</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
