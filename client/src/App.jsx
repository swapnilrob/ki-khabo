import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerReviews from "./pages/OwnerReviews";

import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterUser from "./pages/RegisterUser";
import RegisterOwner from "./pages/RegisterOwner";
import UserDashboard from "./pages/UserDashboard";
import ProfilePreferences from "./pages/ProfilePreferences";
import HealthDashboard from "./pages/HealthDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ReviewDemo from "./pages/ReviewDemo"; 
import Feed from "./pages/Feed";
import SavedDishes from "./pages/SavedDishes";
import FoodLists from "./pages/FoodLists"; 

import RestaurantList from "./pages/RestaurantList";
import RestaurantProfile from "./pages/RestaurantProfile";
import OwnerMenu from "./pages/OwnerMenu";

import Discover from "./pages/Discover";

import MealPlanner from "./pages/MealPlanner";
import Recommendations from "./pages/Recommendations";
import MyOrders from "./pages/MyOrders";
import OwnerOrders from "./pages/OwnerOrders";
import OwnerAnalytics from "./pages/OwnerAnalytics";
import Subscription from "./pages/Subscription"; 
import Rewards from "./pages/Rewards"; 

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

      {/* M1-3 — Mostahid */}
      <Route
        path="/app/preferences"
        element={
          <ProtectedRoute allow={["user"]}>
            <ProfilePreferences />
          </ProtectedRoute>
        }
      />

      {/* M2-1 — Mostahid */}
      <Route
        path="/app/health"
        element={
          <ProtectedRoute allow={["user"]}>
            <HealthDashboard />
          </ProtectedRoute>
        }
      />

      {/* M2-3 — Swapnil */}
      <Route
        path="/app/meal-planner"
        element={
          <ProtectedRoute allow={["user"]}>
            <MealPlanner />
          </ProtectedRoute>
        }
      />

      <Route path="/reviews-demo" element={<ReviewDemo />} />
      <Route path="/feed" element={<ProtectedRoute allow={["user"]}><Feed /></ProtectedRoute>} />
      <Route path="/saved-dishes" element={<ProtectedRoute allow={["user"]}><SavedDishes /></ProtectedRoute>} />
      <Route path="/food-lists" element={<FoodLists />} />
      {/* M2-2 — Noman */}
      <Route
        path="/app/recommendations"
        element={
          <ProtectedRoute allow={["user"]}>
            <Recommendations />
          </ProtectedRoute>
        }
      /> 
            {/* M3-6 — Shakib */}
      <Route
        path="/app/subscription"
        element={
          <ProtectedRoute allow={["user"]}>
            <Subscription />
          </ProtectedRoute>
        }
      /> 
            {/* M3-7 — Shakib */}
      <Route
        path="/app/rewards"
        element={
          <ProtectedRoute allow={["user"]}>
            <Rewards />
          </ProtectedRoute>
        }
      /> 
            {/* M3-4 — Noman */}
      <Route
        path="/app/orders"
        element={
          <ProtectedRoute allow={["user"]}>
            <MyOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/orders"
        element={
          <ProtectedRoute allow={["owner"]}>
            <OwnerOrders />
          </ProtectedRoute>
        }
      />
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
      <Route
        path="/owner/reviews"
        element={
          <ProtectedRoute allow={["owner"]}>
            <OwnerReviews />
          </ProtectedRoute>
        }
      />
      {/* M3-3 — Swapnil */}
      <Route
        path="/owner/analytics"
        element={
          <ProtectedRoute allow={["owner"]}>
            <OwnerAnalytics />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<h2 style={{ padding: 24 }}>404 — Page not found</h2>} />
    </Routes>
  );
} 