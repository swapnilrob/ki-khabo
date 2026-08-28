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
// Groq deprecated llama-3.3-70b-versatile in June 2026 in favor of this.
export const AI_MODEL = "openai/gpt-oss-120b";

// Vision model — used by AI Food Image Recognition (M3-2). Groq's vision
// lineup changes often (llama-3.2-*-vision-preview and later
// llama-4-scout were both since deprecated) — if this one starts
// returning a 400/404 "model not found" / "decommissioned" error, check
// https://console.groq.com/docs/models for the current vision model.
export const AI_VISION_MODEL = "qwen/qwen3.6-27b";
