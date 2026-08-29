import api from "./axios";

// The axios instance already attaches the token + base URL,
// so these are just thin, readable wrappers around your endpoints.

// ── Reads (public) ──
export const fetchRestaurantReviews = (restaurantId) =>
  api.get(`/reviews/restaurant/${restaurantId}`).then((r) => r.data);

export const fetchDishReviews = (dishId) =>
  api.get(`/reviews/dish/${dishId}`).then((r) => r.data);

// ── User actions (token attached automatically) ──
export const createReview = (payload) =>
  api.post("/reviews", payload).then((r) => r.data);

export const updateReview = (id, payload) =>
  api.put(`/reviews/${id}`, payload).then((r) => r.data);

export const deleteReview = (id) =>
  api.delete(`/reviews/${id}`).then((r) => r.data);

export const fetchMyReviews = () =>
  api.get("/reviews/mine").then((r) => r.data);

// ── Owner action ──
export const respondToReview = (id, text) =>
  api.put(`/reviews/${id}/response`, { text }).then((r) => r.data); 

export const checkReviewEligibility = (restaurantId) =>
  api.get(`/reviews/eligibility/${restaurantId}`).then((r) => r.data);  