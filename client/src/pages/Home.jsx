import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./Home.css";

export default function Home() {
  const { user } = useAuth();

  const dashPath =
    user?.role === "admin" ? "/admin" :
    user?.role === "owner" ? "/owner" : "/app";

  return (
    <div className="kk-app">
      <Navbar />
      <div className="kk-home">
        <div className="kk-home__hero">
          <span className="kk-home__emoji">🍛</span>
          <h1 className="kk-home__title">Ki Khabo?</h1>
          <p className="kk-home__subtitle">
            Discover restaurants, track nutrition, and eat smarter — all in one place.
          </p>

          <div className="kk-home__cta">
            {user ? (
              <Link to={dashPath} className="kk-btn kk-btn--primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="kk-btn kk-btn--primary">
                  Get started
                </Link>
                <Link to="/login" className="kk-btn kk-btn--outline">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="kk-home__features">
          <div className="kk-home__feature">
            <span className="kk-home__feature-icon">🔍</span>
            <h3>Discover</h3>
            <p>Find restaurants by location, cuisine, price, and dietary needs.</p>
          </div>
          <div className="kk-home__feature">
            <span className="kk-home__feature-icon">⭐</span>
            <h3>Rate &amp; Review</h3>
            <p>Share dish-level ratings and read honest community reviews.</p>
          </div>
          <div className="kk-home__feature">
            <span className="kk-home__feature-icon">📊</span>
            <h3>Track Nutrition</h3>
            <p>Log meals and monitor your daily calories and macros.</p>
          </div>
          <div className="kk-home__feature">
            <span className="kk-home__feature-icon">🤖</span>
            <h3>AI Assistant</h3>
            <p>Get personalized meal plans and healthier alternatives.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
