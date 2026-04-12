import { ContentProduct } from "@/models/content";
import { ChunkRecord } from "@/models/retrieval";
import { chunkProductText } from "@/retrieval/chunking";
import { embedTexts } from "@/retrieval/embed";
import { globalVectorStore } from "@/retrieval/vector_store";

export async function ingestProducts(products: ContentProduct[]): Promise<number> {
  const texts: string[] = [];
  const meta: { productId: string; chunkIndex: number }[] = [];

  for (const p of products) {
    const parts = chunkProductText(
      p.id,
      p.title,
      p.description ?? "",
    );
    parts.forEach((text, chunkIndex) => {
      texts.push(text);
      meta.push({ productId: p.id, chunkIndex });
    });
  }

  if (texts.length === 0) return 0;

  const embeddings = await embedTexts(texts);
  const chunks: ChunkRecord[] = texts.map((text, i) => {
    const m = meta[i];
    return new ChunkRecord(
      `${m.productId}:${m.chunkIndex}`,
      m.productId,
      text,
      embeddings[i],
    );
  });

  globalVectorStore.upsert(chunks);
  return chunks.length;
}
