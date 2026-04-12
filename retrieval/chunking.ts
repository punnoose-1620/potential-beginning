/**
 * Split long product text into overlapping chunks for embedding.
 */
export function chunkProductText(
  productId: string,
  title: string,
  description: string,
  maxChunkChars = 1200,
  overlapChars = 120,
): string[] {
  const header = `${title}\n`;
  const body = description.trim();
  if (!body) return [`${header}(no description)`];

  const chunks: string[] = [];
  let start = 0;
  while (start < body.length) {
    const end = Math.min(body.length, start + maxChunkChars);
    chunks.push(`${header}${body.slice(start, end)}`);
    if (end >= body.length) break;
    start = Math.max(0, end - overlapChars);
  }
  return chunks.map((text, i) => `[${productId}#${i}] ${text}`);
}
