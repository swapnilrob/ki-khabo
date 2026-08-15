import api from "./axios";

// ── Public ──
export const fetchRestaurantProfile = (restaurantId) =>
  api.get(`/dishes/restaurant/${restaurantId}`).then((r) => r.data);

export const fetchDish = (dishId) =>
  api.get(`/dishes/${dishId}`).then((r) => r.data);

export const fetchRestaurants = () =>
  api.get("/restaurants").then((r) => r.data);

// ── Owner ──
export const fetchMyMenu = () =>
  api.get("/dishes/my/menu").then((r) => r.data);

export const createDish = (payload) =>
  api.post("/dishes", payload).then((r) => r.data);

export const updateDish = (id, payload) =>
  api.put(`/dishes/${id}`, payload).then((r) => r.data);

export const deleteDish = (id) =>
  api.delete(`/dishes/${id}`).then((r) => r.data);