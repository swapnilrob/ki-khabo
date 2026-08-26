import api from "./axios";

export const fetchMenuOverview = () =>
  api.get("/analytics/menu-overview").then((r) => r.data);

export const fetchDishRankings = () =>
  api.get("/analytics/dish-rankings").then((r) => r.data);

export const fetchRatingTrend = () =>
  api.get("/analytics/rating-trend").then((r) => r.data);

export const fetchReviewSummary = () =>
  api.get("/analytics/review-summary").then((r) => r.data);