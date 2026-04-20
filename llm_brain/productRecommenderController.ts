import type { GenerativeModel } from "@google/generative-ai";
import { productRecommendationUserPrompt } from "@/llm_brain/staticQueries";
import {
  parseProductRecommendationFromText,
  productRecommendationGenerationConfig,
  type ProductRecommendationData,
} from "@/llm_brain/llmOutputStructures";
import {
  setGeminiFlash,
  setGeminiFlashLite,
  setGeminiPro,
} from "@/llm_brain/llmConnectors";
import { MAX_SELECTED_PRODUCTS } from "@/lib/product_selection/constants";

const SYSTEM_STATIC =
  "You are a precise catalog assistant for hotels and events. Follow the JSON schema from generation settings exactly.";

export type ProductCandidateCompact = {
  product_id: number;
  variation_id: number;
  title: string;
  description: string;
};

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

async function recommendOnce(
  userQuery: string,
  candidates: ProductCandidateCompact[],
  llm: GenerativeModel,
): Promise<ProductRecommendationData> {
  const candidatesJson = JSON.stringify(candidates);
  const prefix = productRecommendationUserPrompt(candidatesJson);
  const fullUserText = `${prefix}\n\n${userQuery}`;
  const res = await llm.generateContent(fullUserText);
  const text = res.response.text();
  return parseProductRecommendationFromText(text);
}

/**
 * Flash → Pro → Lite; up to 2 outer cycles (same pattern as runIsolator).
 * Returns null if no model could run (e.g. missing API key) or all attempts fail.
 */
export async function runProductRecommender(
  userQuery: string,
  candidates: ProductCandidateCompact[],
): Promise<ProductRecommendationData | null> {
  if (candidates.length === 0) {
    return { selected_product_ids: [], notes: undefined };
  }

  const config = productRecommendationGenerationConfig();
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
        const raw = await recommendOnce(userQuery, candidates, model);
        const allowed = new Set(candidates.map((c) => c.product_id));
        const filtered = raw.selected_product_ids.filter((id) => allowed.has(id));
        const dedup: number[] = [];
        const seen = new Set<number>();
        for (const id of filtered) {
          if (seen.has(id)) continue;
          seen.add(id);
          dedup.push(id);
          if (dedup.length >= MAX_SELECTED_PRODUCTS) break;
        }
        return { selected_product_ids: dedup, notes: raw.notes };
      } catch (e) {
        lastError = e;
        if (!isRateLimitError(e)) {
          /* try next tier */
        }
      }
    }
  }
  if (lastError) console.error("runProductRecommender exhausted:", lastError);
  return null;
}
