/** Base URL for Proposales HTTP API */
export const PROPOSALES_BASE_URL =
  process.env.PROPOSALES_BASE_URL ?? "https://api.proposales.com";

/** Default Gemini chat model for reasoning steps */
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

/** Tier models for File Plan `runIsolator` (Flash → Pro → Lite) */
export const GEMINI_MODEL_FLASH =
  process.env.GEMINI_MODEL_FLASH ?? "gemini-2.5-flash";
export const GEMINI_MODEL_FLASH_LITE =
  process.env.GEMINI_MODEL_FLASH_LITE ?? "gemini-2.5-flash-lite";
export const GEMINI_MODEL_PRO =
  process.env.GEMINI_MODEL_PRO ?? "gemini-2.5-pro";

/** Default embedding model id (Google AI) */
export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "text-embedding-004";

/** How many chunks to return from retrieval for planning */
export const RETRIEVAL_TOP_K = Number(process.env.RETRIEVAL_TOP_K ?? "12");
