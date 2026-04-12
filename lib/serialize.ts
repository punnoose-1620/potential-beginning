import type { PipelineResult } from "@/models/pipeline";

/** Plain JSON shape for API + client */
export function serializePipelineResult(p: PipelineResult) {
  return {
    extracted: {
      rawText: p.extracted.rawText,
      summary: p.extracted.summary,
      eventType: p.extracted.eventType,
      guestCount: p.extracted.guestCount,
      dateHints: p.extracted.dateHints,
      budgetCurrency: p.extracted.budgetCurrency,
      budgetMin: p.extracted.budgetMin,
      budgetMax: p.extracted.budgetMax,
      specialRequests: p.extracted.specialRequests,
      dietaryNotes: p.extracted.dietaryNotes,
    },
    retrievalHits: p.retrievalHits.map((h) => ({
      score: h.score,
      productId: h.chunk.productId,
      textPreview: h.chunk.text.slice(0, 500),
    })),
    plan: {
      notes: p.plan.notes,
      blocks: p.plan.blocks.map((b) => ({
        id: b.id,
        title: b.title,
        intent: b.intent,
        productIds: b.productIds,
      })),
    },
    draft: {
      title: p.draft.title,
      blocks: p.draft.blocks.map((b) => ({
        blockId: b.blockId,
        title: b.title,
        bodyMarkdown: b.bodyMarkdown,
        citedProductIds: b.citedProducts.map((x) => x.id),
      })),
    },
    proposalId: p.proposalId,
    selfReview: {
      gaps: p.selfReview.gaps,
      suggestions: p.selfReview.suggestions,
    },
    evaluation: {
      overall: p.evaluation.overall,
      summary: p.evaluation.summary,
      dimensions: p.evaluation.dimensions.map((d) => ({
        name: d.name,
        score: d.score,
        max: d.max,
        rationale: d.rationale,
      })),
    },
    warnings: p.warnings,
  };
}
