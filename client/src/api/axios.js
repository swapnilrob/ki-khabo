import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kk_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If a token expires mid-session, send the user back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("kk_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;