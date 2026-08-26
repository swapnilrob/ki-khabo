import api from "./axios";

export const getRewards = () =>
  api.get("/rewards").then((r) => r.data);

export const redeemPoints = (pointsToRedeem) =>
  api.post("/rewards/redeem", { pointsToRedeem }).then((r) => r.data); 