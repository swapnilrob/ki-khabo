import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dashPath =
    user?.role === "admin" ? "/admin" :
    user?.role === "owner" ? "/owner" : "/app";

  return (
    <nav className="kk-navbar">
      <div className="kk-navbar__inner">
        {/* ── Brand ── */}
        <Link to={user ? dashPath : "/"} className="kk-navbar__brand">
          <span className="kk-navbar__logo-icon">🍴</span>
          <span className="kk-navbar__logo-text">Ki Khabo</span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className={`kk-navbar__links ${menuOpen ? "kk-navbar__links--open" : ""}`}>
          <NavLink to="/discover" className="kk-navbar__link" onClick={() => setMenuOpen(false)}>
            Discover
          </NavLink>
          <NavLink to="/app/health" className="kk-navbar__link" onClick={() => setMenuOpen(false)}>
            Healthy
          </NavLink>
          <NavLink to="/feed" className="kk-navbar__link" onClick={() => setMenuOpen(false)}>
            Community
          </NavLink>
          {user && (
            <NavLink to={dashPath} className="kk-navbar__link kk-navbar__link--mobile-only" onClick={() => setMenuOpen(false)}>
              Dashboard
            </NavLink>
          )}
        </div>

        {/* ── Right side ── */}
        <div className="kk-navbar__actions">
          <div className="kk-navbar__search">
            <svg className="kk-navbar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="kk-navbar__search-input"
              aria-label="Search restaurants and dishes"
            />
          </div>

          {user ? (
            <div className="kk-navbar__user-group">
              <Link to={dashPath} className="kk-navbar__avatar" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </Link>
              <button onClick={handleLogout} className="kk-btn kk-btn--ghost kk-btn--sm">
                Log out
              </button>
            </div>
          ) : (
            <Link to="/login" className="kk-btn kk-btn--primary kk-btn--sm">
              Login
            </Link>
          )}

          {/* ── Mobile hamburger ── */}
          <button
            className={`kk-navbar__hamburger ${menuOpen ? "kk-navbar__hamburger--open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
