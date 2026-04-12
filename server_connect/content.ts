import { proposalesFetch } from "@/server_connect/client";

/** GET /v3/content */
export async function listContent(
  query?: Record<string, string | number | boolean | undefined>,
): Promise<unknown> {
  return proposalesFetch<unknown>("/v3/content", { query });
}

/** POST /v3/content */
export async function createContent(body: unknown): Promise<unknown> {
  return proposalesFetch<unknown>("/v3/content", { method: "POST", body });
}

/** PUT /v3/content */
export async function updateContent(body: unknown): Promise<unknown> {
  return proposalesFetch<unknown>("/v3/content", { method: "PUT", body });
}
