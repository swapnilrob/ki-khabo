import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2>Log in to Ki Khabo</h2>
        {error && <p className="error">{error}</p>}

        <input
          name="email" type="email" placeholder="Email"
          value={form.email} onChange={handleChange} required
        />
        <input
          name="password" type="password" placeholder="Password"
          value={form.password} onChange={handleChange} required
        />

        <button type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>

        <p>
          New here? <Link to="/register">Create an account</Link> ·{" "}
          <Link to="/register-owner">Register a restaurant</Link>
        </p>
      </form>
    </div>
  );
}