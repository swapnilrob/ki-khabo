import api from "./axios";

export const fetchMyMealPlans = () =>
  api.get("/meal-planner/my-plans").then((r) => r.data);

export const fetchMealPlan = (id) =>
  api.get(`/meal-planner/${id}`).then((r) => r.data);

export const createMealPlan = (payload) =>
  api.post("/meal-planner", payload).then((r) => r.data);

export const updateMealPlan = (id, payload) =>
  api.put(`/meal-planner/${id}`, payload).then((r) => r.data);

export const deleteMealPlan = (id) =>
  api.delete(`/meal-planner/${id}`).then((r) => r.data);