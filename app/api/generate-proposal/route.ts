import { NextResponse } from "next/server";
import { buildCreateProposalBody } from "@/lib/booking_to_proposal";
import { runIsolator } from "@/llm_brain/llmControllers";
import {
  createProposal,
  extractProposalUuidFromCreateResponse,
  getSingleProposal,
  listProducts,
} from "@/server_connect/proposalesConnector";

type Body = {
  query?: unknown;
  company?: unknown;
  product_ids?: unknown;
};

function parseProductIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: number[] = [];
  for (const id of raw) {
    if (typeof id === "number" && Number.isFinite(id)) {
      out.push(id);
      continue;
    }
    if (typeof id === "string" && id.trim() !== "" && Number.isFinite(Number(id))) {
      out.push(Number(id));
      continue;
    }
    return null;
  }
  return out;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const company = body.company;
  const productIds = parseProductIds(body.product_ids);

  if (typeof company !== "number" || !Number.isFinite(company)) {
    return NextResponse.json({ error: "company must be a finite number (company id)" }, { status: 400 });
  }
  if (!productIds) {
    return NextResponse.json(
      { error: "product_ids must be a non-empty array of numeric ids" },
      { status: 400 },
    );
  }
  if (query.length < 50) {
    return NextResponse.json(
      { error: "query must be at least 50 characters after trim" },
      { status: 400 },
    );
  }

  const { data: allProducts } = await listProducts();
  const idSet = new Set(productIds);
  const productRows = allProducts.filter((p) => idSet.has(p.product_id));
  if (productRows.length === 0) {
    return NextResponse.json(
      { error: "No products found for the given product_ids" },
      { status: 400 },
    );
  }

  const isolator = await runIsolator(query);
  if (!isolator) {
    return NextResponse.json(
      { error: "Could not extract booking details (LLM unavailable or failed)" },
      { status: 502 },
    );
  }

  const createBody = buildCreateProposalBody(company, "en", isolator.booking, query, productRows);
  const createRes = await createProposal(createBody);
  const uuid = extractProposalUuidFromCreateResponse(createRes);
  if (!uuid) {
    return NextResponse.json(
      { error: "Create response missing proposal uuid", create: createRes },
      { status: 502 },
    );
  }

  const proposal = await getSingleProposal(uuid);

  return NextResponse.json({
    create: createRes,
    proposal,
    verificationRequired: isolator.verificationRequired,
  });
}
