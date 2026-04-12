import { RETRIEVAL_TOP_K } from "@/lib/constants";
import { productMapFromList } from "@/lib/proposales_normalize";
import { normalizeContentProducts } from "@/lib/proposales_normalize";
import { PipelineResult, SelfReviewResult } from "@/models/pipeline";
import { ProposalDraft } from "@/models/proposal";
import { ContentProduct } from "@/models/content";
import { hasGeminiKey } from "@/llm_brain/client";
import { extractRfpHeuristic, extractRfpRequirements } from "@/llm_brain/extract_rfp";
import { planProposal, planProposalFallback } from "@/llm_brain/plan_proposal";
import { generateBlock, generateBlockFallback } from "@/llm_brain/generate_block";
import { selfReviewProposal, selfReviewFallback } from "@/llm_brain/self_review";
import { embedQuery } from "@/retrieval/embed";
import { globalVectorStore } from "@/retrieval/vector_store";
import { listContent } from "@/server_connect/content";
import { createProposal } from "@/server_connect/proposals";
import { runEvaluation } from "@/controllers/evaluate";
import { ingestProducts } from "@/retrieval/ingest";
import type { GeneratedBlock } from "@/models/proposal";

async function loadProducts(): Promise<{
  products: ContentProduct[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  try {
    const raw = await listContent();
    const products = normalizeContentProducts(raw);
    return { products, warnings };
  } catch (e) {
    warnings.push(
      e instanceof Error ? e.message : "Could not load Proposales content.",
    );
    return { products: [], warnings };
  }
}

export async function runPipeline(rfpText: string): Promise<PipelineResult> {
  const warnings: string[] = [];

  const { products, warnings: loadWarnings } = await loadProducts();
  warnings.push(...loadWarnings);

  const ingested = await ingestProducts(products);
  if (ingested === 0 && products.length > 0) {
    warnings.push("Ingest produced no chunks — check descriptions.");
  }

  const productById = productMapFromList(products);

  let extracted = extractRfpHeuristic(rfpText);
  if (hasGeminiKey()) {
    try {
      extracted = await extractRfpRequirements(rfpText);
    } catch (e) {
      warnings.push(
        `Gemini extract failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      extracted = extractRfpHeuristic(rfpText);
    }
  } else {
    warnings.push("GEMINI_API_KEY not set — using heuristic extraction.");
  }

  const queryText = `${extracted.summary}\n${rfpText}`.slice(0, 8000);
  const qVec = await embedQuery(queryText);
  const retrievalHits = globalVectorStore.search(qVec, RETRIEVAL_TOP_K);

  let plan = planProposalFallback(extracted, retrievalHits);
  if (hasGeminiKey()) {
    try {
      plan = await planProposal(extracted, retrievalHits);
    } catch (e) {
      warnings.push(
        `Gemini plan failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const blocks: GeneratedBlock[] = [];
  for (const b of plan.blocks) {
    const cited: ContentProduct[] = [];
    for (const pid of b.productIds) {
      const p = productById.get(pid);
      if (p) cited.push(p);
    }
    if (cited.length === 0 && retrievalHits.length > 0) {
      const fallbackId = retrievalHits[0].chunk.productId;
      const p = productById.get(fallbackId);
      if (p) cited.push(p);
    }

    if (hasGeminiKey()) {
      try {
        blocks.push(await generateBlock(extracted, b, cited));
      } catch (e) {
        warnings.push(
          `Block ${b.id} generation failed: ${e instanceof Error ? e.message : String(e)}`,
        );
        blocks.push(generateBlockFallback(b, cited));
      }
    } else {
      blocks.push(generateBlockFallback(b, cited));
    }
  }

  const draft = new ProposalDraft(
    extracted.summary.slice(0, 120) || "Proposal",
    blocks,
  );

  let proposalId: string | null = null;
  try {
    const created = await createProposal({
      title: draft.title,
      blocks: draft.blocks.map((bl) => ({
        title: bl.title,
        body: bl.bodyMarkdown,
      })),
    });
    if (created && typeof created === "object") {
      const o = created as Record<string, unknown>;
      const id =
        typeof o.uuid === "string"
          ? o.uuid
          : typeof o.id === "string"
            ? o.id
            : typeof o.proposalId === "string"
              ? o.proposalId
              : null;
      proposalId = id;
    }
  } catch (e) {
    warnings.push(
      `Proposales create proposal failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  let selfReview: SelfReviewResult = selfReviewFallback();
  if (hasGeminiKey()) {
    try {
      selfReview = await selfReviewProposal(extracted, draft);
    } catch (e) {
      warnings.push(
        `Self-review failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const evaluation = await runEvaluation(extracted, draft);

  return new PipelineResult(
    extracted,
    retrievalHits,
    plan,
    draft,
    proposalId,
    selfReview,
    evaluation,
    warnings,
  );
}
