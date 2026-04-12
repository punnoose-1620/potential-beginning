import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { GenerationConfig } from "@google/generative-ai";
import {
  GEMINI_MODEL_FLASH,
  GEMINI_MODEL_FLASH_LITE,
  GEMINI_MODEL_PRO,
} from "@/lib/constants";

export class APIKeyError extends Error {
  constructor(message = "Missing GEMINI_API_KEY") {
    super(message);
    this.name = "APIKeyError";
  }
}

export function getGeminiApiKey(): string {
  const k = process.env.GEMINI_API_KEY?.trim();
  if (!k) throw new APIKeyError();
  return k;
}

function makeModel(
  model: string,
  staticQuery: string,
  generationConfig: GenerationConfig,
): GenerativeModel {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  return genAI.getGenerativeModel({
    model,
    systemInstruction: staticQuery,
    generationConfig,
  });
}

export function setGeminiFlash(
  staticQuery: string,
  generationConfig: GenerationConfig,
): GenerativeModel {
  return makeModel(GEMINI_MODEL_FLASH, staticQuery, generationConfig);
}

export function setGeminiFlashLite(
  staticQuery: string,
  generationConfig: GenerationConfig,
): GenerativeModel {
  return makeModel(GEMINI_MODEL_FLASH_LITE, staticQuery, generationConfig);
}

export function setGeminiPro(
  staticQuery: string,
  generationConfig: GenerationConfig,
): GenerativeModel {
  return makeModel(GEMINI_MODEL_PRO, staticQuery, generationConfig);
}
