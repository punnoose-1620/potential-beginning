/**
 * Parse JSON from model output; strips markdown fences if present.
 */
export function parseJsonObject<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (fence) text = fence[1].trim();

  const jsonStart = text.indexOf("{");
  const jsonArray = text.indexOf("[");
  const start =
    jsonStart >= 0 && (jsonArray < 0 || jsonStart < jsonArray)
      ? jsonStart
      : jsonArray >= 0
        ? jsonArray
        : -1;
  if (start >= 0) text = text.slice(start);

  return JSON.parse(text) as T;
}
