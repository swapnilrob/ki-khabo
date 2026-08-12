import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session when the page is refreshed
  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        setRestaurant(data.restaurant || null);
      })
      .catch(() => localStorage.removeItem("kk_token"))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem("kk_token", data.token);
    setUser(data.user);
    setRestaurant(data.restaurant || null);
    return data.user;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return saveSession(data);
  };

  const registerUser = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return saveSession(data);
  };

  const registerOwner = async (payload) => {
    const { data } = await api.post("/auth/register-owner", payload);
    return saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem("kk_token");
    setUser(null);
    setRestaurant(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, restaurant, loading, login, registerUser, registerOwner, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);