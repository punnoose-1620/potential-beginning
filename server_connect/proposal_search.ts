import { proposalesFetch } from "@/server_connect/client";

/** GET /v3/proposal-search */
export async function searchProposals(
  query?: Record<string, string | number | boolean | undefined>,
): Promise<unknown> {
  return proposalesFetch<unknown>("/v3/proposal-search", { query });
}
