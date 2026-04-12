import { randomUUID } from "crypto";
import { ContentProduct } from "@/models/content";

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickId(obj: Record<string, unknown>): string {
  const id =
    pickString(obj, ["id", "uuid", "contentId"]) ??
    (typeof obj.id === "number" ? String(obj.id) : null);
  return id ?? randomUUID();
}

/** Best-effort mapping for Proposales list content JSON (shape may vary by API version). */
export function normalizeContentProducts(data: unknown): ContentProduct[] {
  const rows: unknown[] = [];
  if (Array.isArray(data)) rows.push(...data);
  else if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const arr = o.data ?? o.items ?? o.content ?? o.results;
    if (Array.isArray(arr)) rows.push(...arr);
  }

  const out: ContentProduct[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const obj = row as Record<string, unknown>;
    const title =
      pickString(obj, ["title", "name", "label"]) ?? "Untitled product";
    const description = pickString(obj, [
      "description",
      "body",
      "text",
      "summary",
    ]);
    out.push(
      new ContentProduct(pickId(obj), title, description, { ...obj }),
    );
  }
  return out;
}

export function productMapFromList(products: ContentProduct[]): Map<string, ContentProduct> {
  return new Map(products.map((p) => [p.id, p]));
}
