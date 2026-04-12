import { proposalesFetch } from "@/server_connect/client";

/** GET /v3/companies */
export async function listCompanies(): Promise<unknown> {
  return proposalesFetch<unknown>("/v3/companies");
}
