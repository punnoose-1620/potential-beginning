import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { GEMINI_MODEL } from "@/lib/constants";

export function getGeminiModel(): GenerativeModel {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
