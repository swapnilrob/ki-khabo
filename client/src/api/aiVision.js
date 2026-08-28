import api from "./axios";

// M3-2 — AI Food Image Recognition

export const recognizeFood = (imageBase64) =>
  api.post("/ai-vision/recognize", { imageBase64 }).then((r) => r.data);

export const logRecognizedMeal = (payload) =>
  api.post("/ai-vision/log", payload).then((r) => r.data);
