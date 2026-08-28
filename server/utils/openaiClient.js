import OpenAI from "openai";

// M3-1 / M3-2 (Mostahid) — shared Groq client.
//
// Groq exposes an OpenAI-compatible endpoint, so the same `openai` SDK
// works unchanged — only the apiKey/baseURL/model names differ from a
// real OpenAI setup. Constructed lazily (only on first real use) so a
// missing GROQ_API_KEY doesn't crash the whole server at boot — only
// requests to the AI routes fail, with a clear 503, until it's configured.
let client = null;

export const getOpenAIClient = () => {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error(
      "GROQ_API_KEY is not configured on the server. Add it to server/.env to enable AI features."
    );
    err.statusCode = 503;
    throw err;
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
};

// Text model — used by the AI Nutrition Assistant's chat (M3-1).
export const AI_MODEL = "llama-3.3-70b-versatile";

// Vision model — used by AI Food Image Recognition (M3-2). Groq's vision
// models are labeled "preview" and get renamed/rotated fairly often —
// check https://console.groq.com/docs/models for the current vision
// model name if this one starts returning a 400/404 "model not found".
export const AI_VISION_MODEL = "llama-3.2-11b-vision-preview";
