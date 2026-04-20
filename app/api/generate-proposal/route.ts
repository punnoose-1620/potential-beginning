import { NextResponse } from "next/server";
import { buildCreateProposalBody } from "@/lib/booking_to_proposal";
import { extractKeywordsDeterministic } from "@/lib/product_selection/extractKeywords";
import {
  productDisplayTexts,
  scoreAndFilterProducts,
  type ProductListRow,
} from "@/lib/product_selection/scoreAndFilterProducts";
import { runIsolator } from "@/llm_brain/llmControllers";
import { runProductRecommender } from "@/llm_brain/productRecommenderController";
import {
  createProposal,
  extractProposalUuidFromCreateResponse,
  getSingleProposal,
  listProducts,
} from "@/server_connect/proposalesConnector";

type Body = {
  query?: unknown;
  company?: unknown;
};

type SkipReason =
  | "no_candidates"
  | "llm_failed"
  | "llm_returned_empty"
  | "invalid_llm_output";

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const company = body.company;

  if (typeof company !== "number" || !Number.isFinite(company)) {
    return NextResponse.json({ error: "company must be a finite number (company id)" }, { status: 400 });
  }
  if (query.length < 50) {
    return NextResponse.json(
      { error: "query must be at least 50 characters after trim" },
      { status: 400 },
    );
  }

  const { data: allProducts } = await listProducts();
  const productRows = allProducts as ProductListRow[];

  const { keywords, tokens, bigrams } = extractKeywordsDeterministic(query);
  const scored = scoreAndFilterProducts(productRows, keywords);

  const baseDiagnostics = {
    keywords,
    tokens,
    bigrams,
    candidate_product_ids: scored.map((p) => p.product_id),
  };

  if (scored.length === 0) {
    return NextResponse.json({
      created: false,
      reason: "no_candidates" satisfies SkipReason,
      recommended_products: [] as ProductListRow[],
      create: undefined,
      proposal: undefined,
      verificationRequired: undefined,
      diagnostics: baseDiagnostics,
    });
  }

  const llmCandidates = scored.map((p) => {
    const { title, description } = productDisplayTexts(p);
    return {
      product_id: p.product_id,
      variation_id: p.variation_id,
      title,
      description,
    };
  });

  const recommendation = await runProductRecommender(query, llmCandidates);

  if (!recommendation) {
    return NextResponse.json({
      created: false,
      reason: "llm_failed" satisfies SkipReason,
      recommended_products: [] as ProductListRow[],
      create: undefined,
      proposal: undefined,
      verificationRequired: undefined,
      diagnostics: {
        ...baseDiagnostics,
        llm_notes: undefined as string | undefined,
      },
    });
  }

  const idSet = new Map(productRows.map((p) => [p.product_id, p]));
  const orderedRows: ProductListRow[] = [];
  for (const id of recommendation.selected_product_ids) {
    const row = idSet.get(id);
    if (row) orderedRows.push(row);
  }

  if (recommendation.selected_product_ids.length > 0 && orderedRows.length === 0) {
    return NextResponse.json({
      created: false,
      reason: "invalid_llm_output" satisfies SkipReason,
      recommended_products: [] as ProductListRow[],
      create: undefined,
      proposal: undefined,
      verificationRequired: undefined,
      diagnostics: {
        ...baseDiagnostics,
        llm_raw_ids: recommendation.selected_product_ids,
        llm_notes: recommendation.notes,
      },
    });
  }

  if (orderedRows.length === 0) {
    return NextResponse.json({
      created: false,
      reason: "llm_returned_empty" satisfies SkipReason,
      recommended_products: [] as ProductListRow[],
      create: undefined,
      proposal: undefined,
      verificationRequired: undefined,
      diagnostics: {
        ...baseDiagnostics,
        llm_notes: recommendation.notes,
      },
    });
  }

  const isolator = await runIsolator(query);
  if (!isolator) {
    return NextResponse.json(
      {
        error: "Could not extract booking details (LLM unavailable or failed)",
        created: false,
        recommended_products: orderedRows,
        diagnostics: {
          ...baseDiagnostics,
          llm_notes: recommendation.notes,
          selected_product_ids: orderedRows.map((p) => p.product_id),
        },
      },
      { status: 502 },
    );
  }

  const createBody = buildCreateProposalBody(company, "en", isolator.booking, query, orderedRows);
  const createRes = await createProposal(createBody);
  const uuid = extractProposalUuidFromCreateResponse(createRes);
  if (!uuid) {
    return NextResponse.json(
      {
        error: "Create response missing proposal uuid",
        created: false,
        recommended_products: orderedRows,
        create: createRes,
        diagnostics: {
          ...baseDiagnostics,
          llm_notes: recommendation.notes,
          selected_product_ids: orderedRows.map((p) => p.product_id),
        },
      },
      { status: 502 },
    );
  }

  const proposal = await getSingleProposal(uuid);

  return NextResponse.json({
    created: true,
    reason: undefined as SkipReason | undefined,
    recommended_products: orderedRows,
    create: createRes,
    proposal,
    verificationRequired: isolator.verificationRequired,
    diagnostics: {
      ...baseDiagnostics,
      llm_notes: recommendation.notes,
      selected_product_ids: orderedRows.map((p) => p.product_id),
    },
  });
}
