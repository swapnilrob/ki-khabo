import api from "./axios";

export const getPlans = () =>
  api.get("/subscription/plans").then((r) => r.data);

export const subscribe = (payload) =>
  api.post("/subscription/subscribe", payload).then((r) => r.data);

export const getSubscriptionStatus = () =>
  api.get("/subscription/status").then((r) => r.data);

export const getSubscriptionHistory = () =>
  api.get("/subscription/history").then((r) => r.data);

export const cancelSubscription = () =>
  api.post("/subscription/cancel").then((r) => r.data); 