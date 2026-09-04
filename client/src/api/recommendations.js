import api from "./axios";

// Personalized recommendations. `params` may include { mealTime, maxPrice, limit }.
// axios attaches the auth token automatically (route is protected).
export const fetchRecommendations = (params) =>
  api.get("/recommendations", { params }).then((r) => r.data);