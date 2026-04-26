/**
 * Groq OpenAI-compatible chat URL and default model.
 * Override with env GROQ_MODEL if Groq deprecates a model id again.
 * @see https://console.groq.com/docs/models
 */
export const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Replaces decommissioned llama3-8b-8192 */
export const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

export function getGroqModel() {
  return (process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim();
}
