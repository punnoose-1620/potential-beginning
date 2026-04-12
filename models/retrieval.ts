/**
 * A searchable unit derived from a product (chunk + vector id).
 */
export class ChunkRecord {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly text: string,
    public readonly embedding: number[],
  ) {}
}

/** One hit from semantic search */
export class SearchHit {
  constructor(
    public readonly chunk: ChunkRecord,
    public readonly score: number,
  ) {}
}
