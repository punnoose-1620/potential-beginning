import { ChunkRecord, SearchHit } from "@/models/retrieval";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** In-memory vector store for retrieval demos (swap for DB at scale). */
export class VectorStore {
  private chunks: ChunkRecord[] = [];

  upsert(chunks: ChunkRecord[]): void {
    const ids = new Set(chunks.map((c) => c.id));
    this.chunks = this.chunks.filter((c) => !ids.has(c.id));
    this.chunks.push(...chunks);
  }

  clear(): void {
    this.chunks = [];
  }

  search(queryEmbedding: number[], topK: number): SearchHit[] {
    const scored = this.chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => new SearchHit(s.chunk, s.score));
  }

  all(): ChunkRecord[] {
    return [...this.chunks];
  }
}

/** Process-wide singleton for serverless warm instances (good enough for challenge). */
export const globalVectorStore = new VectorStore();
