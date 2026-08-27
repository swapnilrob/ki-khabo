import api from "./axios";

// M3-1 — AI Nutrition & Diet Assistant

export const fetchHealthProfile = () =>
  api.get("/ai-assistant/health-profile").then((r) => r.data);

export const updateHealthProfile = (profile) =>
  api.put("/ai-assistant/health-profile", profile).then((r) => r.data);

export const applyTargetGoal = () =>
  api.post("/ai-assistant/apply-target-goal").then((r) => r.data);

export const sendChatMessage = (message) =>
  api.post("/ai-assistant/chat", { message }).then((r) => r.data);

export const fetchChatHistory = () =>
  api.get("/ai-assistant/chat").then((r) => r.data);

export const clearChatHistory = () =>
  api.delete("/ai-assistant/chat").then((r) => r.data);
