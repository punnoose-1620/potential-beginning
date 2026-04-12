import { PROPOSALES_BASE_URL } from "@/lib/constants";

export class ProposalesHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = "ProposalesHttpError";
  }
}

function getApiKey(): string {
  const key = process.env.PROPOSALES_API_KEY;
  if (!key) {
    throw new Error("Missing PROPOSALES_API_KEY");
  }
  return key;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function proposalesFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  const { method = "GET", body, query } = options;
  const url = new URL(path, PROPOSALES_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new ProposalesHttpError(
      `Proposales ${method} ${url.pathname} failed`,
      res.status,
      text,
    );
  }

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
