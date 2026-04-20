import type { GenerativeModel } from "@google/generative-ai";
import { isolateParameterQuery } from "@/llm_brain/staticQueries";
import {
  bookingDetailsGenerationConfig,
  emptyBookingDetails,
  getBookingDetailsDescriptionText,
  parseBookingDetailsFromText,
  verifyFullBooking,
  type BookingDetailsData,
} from "@/llm_brain/llmOutputStructures";
import {
  setGeminiFlash,
  setGeminiFlashLite,
  setGeminiPro,
} from "@/llm_brain/llmConnectors";

export type IsolateResult = {
  booking: BookingDetailsData;
  verificationRequired: boolean;
};

const SYSTEM_STATIC =
  "You are a precise information extractor for hotel and event RFPs. Follow the JSON schema from generation settings exactly.";

function isRateLimitError(e: unknown): boolean {
  const seen = new Set<unknown>();
  const queue: unknown[] = [e];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur || seen.has(cur)) continue;
    seen.add(cur);
    if (typeof cur === "string") {
      const s = cur.toLowerCase();
      if (s.includes("429") || s.includes("resource_exhausted") || s.includes("quota")) return true;
      continue;
    }
    if (typeof cur === "number") {
      if (cur === 429) return true;
      continue;
    }
    if (typeof cur === "object") {
      const rec = cur as Record<string, unknown>;
      const status = rec.status;
      const code = rec.code;
      if (status === 429 || code === 429 || code === "429") return true;
      if (typeof status === "string" && status.includes("429")) return true;
      if (typeof code === "string" && code.toLowerCase().includes("resource_exhausted")) return true;
      if ("message" in rec) queue.push(rec.message);
      if ("cause" in rec) queue.push(rec.cause);
      continue;
    }
  }
  return false;
}

/**
 * File Plan §4 — up to 3 generation attempts; last parsed payload + verificationRequired if still invalid.
 */
export async function isolateParameters(
  userQuery: string,
  llmInstance: GenerativeModel,
): Promise<IsolateResult> {
  const desc = getBookingDetailsDescriptionText();
  const fullUserText = `${isolateParameterQuery(desc)}\n\n${userQuery}`;

  let lastParsed: BookingDetailsData | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await llmInstance.generateContent(fullUserText);
      const text = res.response.text();
      const booking = parseBookingDetailsFromText(text);
      lastParsed = booking;
      verifyFullBooking(booking);
      return { booking, verificationRequired: false };
    } catch {
      /* retry */
    }
  }

  if (!lastParsed) {
    lastParsed = emptyBookingDetails();
  }
  return { booking: lastParsed, verificationRequired: true };
}

/**
 * File Plan §4 — Flash → Pro → Lite; outer cycle at most twice.
 */
export async function runIsolator(userQuery: string): Promise<IsolateResult | null> {
  const config = bookingDetailsGenerationConfig();
  const makers = [
    () => setGeminiFlash(SYSTEM_STATIC, config),
    () => setGeminiPro(SYSTEM_STATIC, config),
    () => setGeminiFlashLite(SYSTEM_STATIC, config),
  ] as const;

  let lastError: unknown;
  for (let cycle = 0; cycle < 2; cycle++) {
    for (const make of makers) {
      try {
        const model = make();
        return await isolateParameters(userQuery, model);
      } catch (e) {
        lastError = e;
        if (!isRateLimitError(e)) {
          /* still try next tier per plan */
        }
      }
    }
  }
  if (lastError) console.error("runIsolator exhausted:", lastError);
  return null;
}
