import { proposalesFetch } from "@/server_connect/client";

/** POST /v3/proposals */
export async function createProposal(body: unknown): Promise<unknown> {
  return proposalesFetch<unknown>("/v3/proposals", { method: "POST", body });
}

/** GET /v3/proposals/{uuid} */
export async function getProposal(uuid: string): Promise<unknown> {
  return proposalesFetch<unknown>(`/v3/proposals/${encodeURIComponent(uuid)}`);
}
