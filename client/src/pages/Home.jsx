import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Ki Khabo 🍽️</h2>
        <p>AI-Powered Smart Food Platform</p>
        <Link to="/login"><button style={{ width: "100%" }}>Log in</button></Link>
        <Link to="/register"><button style={{ width: "100%" }}>Sign up as a user</button></Link>
        <Link to="/register-owner"><button style={{ width: "100%" }}>Register a restaurant</button></Link>
      </div>
    </div>
  );
}