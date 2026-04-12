import { ExtractedRequirements } from "@/models/rfp";
import { getGeminiModel } from "@/llm_brain/client";
import { parseJsonObject } from "@/llm_brain/json_utils";

type ExtractJson = {
  summary?: string;
  eventType?: string | null;
  guestCount?: number | null;
  dateHints?: string[];
  budgetCurrency?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  specialRequests?: string[];
  dietaryNotes?: string[];
};

export async function extractRfpRequirements(
  rawText: string,
): Promise<ExtractedRequirements> {
  const model = getGeminiModel();
  const prompt = `You are a hotel RFP analyst. Extract structured fields from the request below.
Return ONLY valid JSON with keys:
summary (string), eventType (string|null), guestCount (number|null),
dateHints (string[]), budgetCurrency (string|null), budgetMin (number|null), budgetMax (number|null),
specialRequests (string[]), dietaryNotes (string[]).

RFP:
---
${rawText}
---`;

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = res.response.text();
  const j = parseJsonObject<ExtractJson>(text);
  return new ExtractedRequirements(
    rawText,
    j.summary ?? "",
    j.eventType ?? null,
    j.guestCount ?? null,
    j.dateHints ?? [],
    j.budgetCurrency ?? null,
    j.budgetMin ?? null,
    j.budgetMax ?? null,
    j.specialRequests ?? [],
    j.dietaryNotes ?? [],
  );
}

/** Fallback when Gemini is unavailable (no key or error). */
export function extractRfpHeuristic(rawText: string): ExtractedRequirements {
  const digits = rawText.match(/\d+/g);
  const guestGuess = digits
    ? Number(digits.map((d) => parseInt(d, 10)).sort((a, b) => b - a)[0])
    : null;
  return new ExtractedRequirements(
    rawText,
    rawText.slice(0, 200),
    null,
    guestGuess && guestGuess < 5000 ? guestGuess : null,
    [],
    "EUR",
    null,
    null,
    [],
    [],
  );
}
