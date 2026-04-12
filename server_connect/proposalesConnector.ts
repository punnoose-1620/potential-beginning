import { randomUUID } from "crypto";
import { PROPOSALES_BASE_URL } from "@/lib/constants";
import { proposalesFetch } from "@/server_connect/client";

export class ProposalesApiKeyError extends Error {
  constructor() {
    super("Missing PROPOSALES_API_KEY");
    this.name = "ProposalesApiKeyError";
  }
}

/** File Plan §5 — raised when key required explicitly; list* helpers fall back without calling this. */
export function getProposalesApiKey(): string {
  const k = process.env.PROPOSALES_API_KEY?.trim();
  if (!k) throw new ProposalesApiKeyError();
  return k;
}

type CompanyRow = {
  id: number;
  created_at: number;
  name: string;
  currency: string;
  tax_mode: string;
  registration_number: string;
  website_url: string;
};

type ProductRow = {
  created_at: number;
  description: Record<string, unknown>;
  product_id: number;
  variation_id: number;
  title: Record<string, unknown>;
  is_archived: Record<string, unknown>;
  sources: Record<string, unknown>;
  images: Record<string, unknown>[];
  integration_id: number;
  integration_metadata: Record<string, unknown>;
};

/** Mutable in-memory fallbacks (File Plan). */
export const DUMMY_COMPANIES: CompanyRow[] = [
  {
    id: 1,
    created_at: Math.floor(Date.now() / 1000),
    name: "Demo Hotel Group",
    currency: "EUR",
    tax_mode: "standard",
    registration_number: "DEMO-001",
    website_url: "https://example.com",
  },
];

export const DUMMY_PRODUCTS: ProductRow[] = [
  {
    created_at: Math.floor(Date.now() / 1000),
    description: { en: "Full-day boardroom, AV, catering." },
    product_id: 1001,
    variation_id: 2001,
    title: { en: "Executive boardroom package" },
    is_archived: { "en": false },
    sources: {},
    images: [],
    integration_id: 0,
    integration_metadata: {},
  },
  {
    created_at: Math.floor(Date.now() / 1000),
    description: { en: "Gala dinner per guest, beverages." },
    product_id: 1002,
    variation_id: 2002,
    title: { en: "Gala dinner (per guest)" },
    is_archived: { "en": false },
    sources: {},
    images: [],
    integration_id: 0,
    integration_metadata: {},
  },
];

/** Full-shaped proposal objects for dummy get/search (subset of API fields). */
export const DUMMY_PROPOSALS: Record<string, unknown>[] = [];

function hasLiveKey(): boolean {
  return Boolean(process.env.PROPOSALES_API_KEY?.trim());
}

export async function listCompanies(): Promise<{ data: CompanyRow[] }> {
  if (!hasLiveKey()) return { data: [...DUMMY_COMPANIES] };
  try {
    const res = await proposalesFetch<{ data: CompanyRow[] }>("/v3/companies");
    return res && Array.isArray(res.data) ? res : { data: [...DUMMY_COMPANIES] };
  } catch (e) {
    console.error("listCompanies", e);
    return { data: [...DUMMY_COMPANIES] };
  }
}

export async function listProducts(): Promise<{ data: ProductRow[] }> {
  if (!hasLiveKey()) return { data: [...DUMMY_PRODUCTS] };
  try {
    const res = await proposalesFetch<{ data: ProductRow[] }>("/v3/content");
    return res && Array.isArray(res.data) ? res : { data: [...DUMMY_PRODUCTS] };
  } catch (e) {
    console.error("listProducts", e);
    return { data: [...DUMMY_PRODUCTS] };
  }
}

function createNewProductDummy(body: unknown): unknown {
  const b = body as Record<string, unknown>;
  const row: ProductRow = {
    created_at: Math.floor(Date.now() / 1000),
    description: typeof b.description === "string" ? { en: b.description } : {},
    product_id: 9000 + DUMMY_PRODUCTS.length,
    variation_id: 9100 + DUMMY_PRODUCTS.length,
    title: typeof b.title === "string" ? { en: b.title } : {},
    is_archived: { en: false },
    sources: {},
    images: [],
    integration_id: 0,
    integration_metadata: {},
  };
  DUMMY_PRODUCTS.push(row);
  return { data: { product_id: row.product_id, variation_id: row.variation_id, message: "dummy" } };
}

export async function createNewProduct(body: unknown): Promise<unknown> {
  if (!hasLiveKey()) return createNewProductDummy(body);
  try {
    return await proposalesFetch("/v3/content", { method: "POST", body });
  } catch (e) {
    console.error("createNewProduct", e);
    return createNewProductDummy(body);
  }
}

function updateExistingProductDummy(body: unknown): unknown {
  const b = body as { product_id?: number; variation_id?: number };
  for (const row of DUMMY_PRODUCTS) {
    if (b.product_id !== undefined && row.product_id === b.product_id) {
      if (typeof (body as { title?: string }).title === "string") {
        row.title = { en: (body as { title: string }).title };
      }
      if (typeof (body as { description?: string }).description === "string") {
        row.description = { en: (body as { description: string }).description };
      }
      break;
    }
    if (b.variation_id !== undefined && row.variation_id === b.variation_id) {
      if (typeof (body as { title?: string }).title === "string") {
        row.title = { en: (body as { title: string }).title };
      }
      break;
    }
  }
  return { data: { product_id: b.product_id ?? 0, variation_id: b.variation_id ?? 0, message: "dummy" } };
}

export async function updateExistingProduct(body: unknown): Promise<unknown> {
  if (!hasLiveKey()) return updateExistingProductDummy(body);
  try {
    return await proposalesFetch("/v3/content", { method: "PUT", body });
  } catch (e) {
    console.error("updateExistingProduct", e);
    return updateExistingProductDummy(body);
  }
}

/** Parse proposal uuid from `POST /v3/proposals` (or dummy) response. */
export function extractProposalUuidFromCreateResponse(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const o = res as Record<string, unknown>;
  const proposal = o.proposal as Record<string, unknown> | undefined;
  if (proposal && typeof proposal.uuid === "string") return proposal.uuid;
  if (typeof o.uuid === "string") return o.uuid;
  return null;
}

function createProposalDummy(body: unknown): unknown {
  const uuid = randomUUID();
  const title_md =
    typeof (body as { title_md?: string }).title_md === "string"
      ? (body as { title_md: string }).title_md
      : "Draft proposal";
  DUMMY_PROPOSALS.push({
    uuid,
    title_md,
    description_md: (body as { description_md?: string }).description_md ?? "",
    company_id: (body as { company_id?: number }).company_id ?? 1,
    currency: "EUR",
    language: (body as { language?: string }).language ?? "en",
    contact_email: (body as { contact_email?: string }).contact_email ?? "",
    data: (body as { data?: unknown }).data ?? {},
    blocks: (body as { blocks?: unknown }).blocks ?? [],
    updated_at: Math.floor(Date.now() / 1000),
    status: "draft",
  });
  return { proposal: { uuid, url: `${PROPOSALES_BASE_URL}/p/${uuid}` } };
}

export async function createProposal(body: unknown): Promise<unknown> {
  if (!hasLiveKey()) return createProposalDummy(body);
  try {
    return await proposalesFetch("/v3/proposals", { method: "POST", body });
  } catch (e) {
    console.error("createProposal", e);
    return createProposalDummy(body);
  }
}

function getSingleProposalDummy(proposalId: string): unknown {
  const hit = DUMMY_PROPOSALS.find((p) => p.uuid === proposalId);
  if (hit) return { data: hit };
  return { data: { uuid: proposalId, title_md: "Not found (dummy)", description_md: "" } };
}

export async function getSingleProposal(proposalId: string): Promise<unknown> {
  if (!hasLiveKey()) return getSingleProposalDummy(proposalId);
  try {
    return await proposalesFetch(`/v3/proposals/${encodeURIComponent(proposalId)}`);
  } catch (e) {
    console.error("getSingleProposal", e);
    return getSingleProposalDummy(proposalId);
  }
}

function searchProposalsDummy(searchString: string): unknown {
  const q = searchString.toLowerCase();
  const hits = DUMMY_PROPOSALS.filter((p) =>
    JSON.stringify(p).toLowerCase().includes(q),
  );
  return {
    data: hits.map((p) => ({
      created_at: (p.updated_at as number) ?? 0,
      updated_at: (p.updated_at as number) ?? 0,
      title: String((p.title_md as string) ?? ""),
      uuid: String(p.uuid),
      series_uuid: "",
      company_id: Number(p.company_id) || 0,
      version: 1,
      status: String(p.status ?? "draft"),
      data: p.data ?? {},
    })),
  };
}

export async function searchProposals(searchString: string): Promise<unknown> {
  if (!hasLiveKey()) return searchProposalsDummy(searchString);
  try {
    return await proposalesFetch("/v3/proposal-search", {
      query: { q: searchString },
    });
  } catch (e) {
    console.error("searchProposals", e);
    return searchProposalsDummy(searchString);
  }
}
