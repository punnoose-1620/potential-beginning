import { listContent } from "@/server_connect/content";
import {
  normalizeContentProducts,
} from "@/lib/proposales_normalize";
import { ingestProducts } from "@/retrieval/ingest";

export type SyncResult = { ingestedChunks: number; productCount: number; warnings: string[] };

/** Fetch content from Proposales and rebuild the in-memory retrieval index. */
export async function syncContentIndex(): Promise<SyncResult> {
  const warnings: string[] = [];
  let productCount = 0;
  let ingestedChunks = 0;

  try {
    const raw = await listContent();
    const products = normalizeContentProducts(raw);
    productCount = products.length;
    ingestedChunks = await ingestProducts(products);
    if (productCount === 0) {
      warnings.push(
        "Content library is empty — add products in Proposales or via POST /v3/content.",
      );
    }
  } catch (e) {
    warnings.push(
      e instanceof Error ? e.message : "Failed to sync content from Proposales.",
    );
  }

  return { ingestedChunks, productCount, warnings };
}
