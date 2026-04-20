import {
  DESC_HIT_WEIGHT,
  MAX_PRODUCT_CANDIDATES,
  TITLE_HIT_WEIGHT,
} from "@/lib/product_selection/constants";

export type ProductListRow = {
  product_id: number;
  variation_id: number;
  title: Record<string, unknown> | string;
  description: Record<string, unknown> | string;
};

export function localeStrings(obj: Record<string, unknown> | string, lang = "en"): string {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return "";
  const direct = obj[lang];
  if (typeof direct === "string") return direct;
  const first = Object.values(obj).find((v) => typeof v === "string");
  return typeof first === "string" ? first : "";
}

export function productSearchTexts(p: ProductListRow): { title: string; description: string; combined: string } {
  const title =
    typeof p.title === "string" ? p.title : localeStrings(p.title as Record<string, unknown>);
  const description =
    typeof p.description === "string"
      ? p.description
      : localeStrings(p.description as Record<string, unknown>);
  const combined = `${title}\n${description}`;
  return {
    title: title.toLowerCase(),
    description: description.toLowerCase(),
    combined: combined.toLowerCase(),
  };
}

/** Human-readable title/description for LLM prompts (not lowercased). */
export function productDisplayTexts(p: ProductListRow): { title: string; description: string } {
  const title =
    typeof p.title === "string" ? p.title : localeStrings(p.title as Record<string, unknown>);
  const description =
    typeof p.description === "string"
      ? p.description
      : localeStrings(p.description as Record<string, unknown>);
  return { title, description };
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while (pos < haystack.length) {
    const i = haystack.indexOf(needle, pos);
    if (i < 0) break;
    count += 1;
    pos = i + Math.max(1, needle.length);
  }
  return count;
}

export type ScoredProduct = ProductListRow & { score: number };

/**
 * Keep products that match at least one keyword/bigram; rank by weighted score; cap at MAX_PRODUCT_CANDIDATES.
 */
export function scoreAndFilterProducts(
  products: ProductListRow[],
  keywords: string[],
): ScoredProduct[] {
  if (keywords.length === 0) return [];

  const scored: ScoredProduct[] = [];

  for (const p of products) {
    const { title, description } = productSearchTexts(p);
    let score = 0;
    let anyHit = false;
    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (!k) continue;
      const inTitle = countOccurrences(title, k);
      const inDesc = countOccurrences(description, k);
      if (inTitle > 0 || inDesc > 0) anyHit = true;
      score += inTitle * TITLE_HIT_WEIGHT + inDesc * DESC_HIT_WEIGHT;
    }
    if (anyHit && score > 0) {
      scored.push({ ...p, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_PRODUCT_CANDIDATES);
}
