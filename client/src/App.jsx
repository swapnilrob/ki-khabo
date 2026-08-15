import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterUser from "./pages/RegisterUser";
import RegisterOwner from "./pages/RegisterOwner";
import UserDashboard from "./pages/UserDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ReviewDemo from "./pages/ReviewDemo"; 

import RestaurantList from "./pages/RestaurantList";
import RestaurantProfile from "./pages/RestaurantProfile";
import OwnerMenu from "./pages/OwnerMenu";

import Discover from "./pages/Discover";

// Sends each role to the right dashboard after login
function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  const map = { user: "/app", owner: "/owner", admin: "/admin" };
  return <Navigate to={map[user.role]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterUser />} />
      <Route path="/register-owner" element={<RegisterOwner />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute allow={["user"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner"
        element={
          <ProtectedRoute allow={["owner"]}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/reviews-demo" element={<ReviewDemo />} />
      {/* M1-1 — Noman */}
      <Route path="/discover" element={<Discover />} />

      {/* M1-2 — Swapnil */}
      <Route path="/restaurants" element={<RestaurantList />} />
      <Route path="/restaurant/:id" element={<RestaurantProfile />} />
      <Route
        path="/owner/menu"
        element={
          <ProtectedRoute allow={["owner"]}>
            <OwnerMenu />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<h2 style={{ padding: 24 }}>404 — Page not found</h2>} />
    </Routes>
  );
} 