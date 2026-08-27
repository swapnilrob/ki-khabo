import OpenAI from "openai";

// M3-1 / M3-2 (Mostahid) — shared OpenAI client.
//
// Constructed lazily (only on first real use) so a missing OPENAI_API_KEY
// doesn't crash the whole server at boot — only requests to the AI routes
// fail, with a clear 503, until the key is configured.
let client = null;

export const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error(
      "OPENAI_API_KEY is not configured on the server. Add it to server/.env to enable AI features."
    );
    err.statusCode = 503;
    throw err;
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
};

// Model used for both chat (text) and vision (image) calls. Centralized
// here so it's a one-line change to upgrade/downgrade for cost or quality.
export const AI_MODEL = "gpt-4o-mini";
