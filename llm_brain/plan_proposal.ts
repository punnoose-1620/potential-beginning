import type { ExtractedRequirements } from "@/models/rfp";
import type { SearchHit } from "@/models/retrieval";
import { ProposalBlockPlan, ProposalPlan } from "@/models/proposal";
import { getGeminiModel } from "@/llm_brain/client";
import { parseJsonObject } from "@/llm_brain/json_utils";

type PlanJson = {
  blocks?: { id: string; title: string; intent: string; productIds: string[] }[];
  notes?: string | null;
};

function hitsContext(hits: SearchHit[]): string {
  return hits
    .slice(0, 20)
    .map(
      (h, i) =>
        `${i + 1}. productId=${h.chunk.productId} score=${h.score.toFixed(3)}\n${h.chunk.text.slice(0, 400)}`,
    )
    .join("\n\n");
}

export async function planProposal(
  extracted: ExtractedRequirements,
  hits: SearchHit[],
): Promise<ProposalPlan> {
  const model = getGeminiModel();
  const prompt = `You plan a hotel proposal structure. Use ONLY product IDs from the retrieval list when referencing inventory.

Extracted summary: ${extracted.summary}
Guest count: ${extracted.guestCount ?? "unknown"}
Budget: ${extracted.budgetMin ?? "?"}–${extracted.budgetMax ?? "?"} ${extracted.budgetCurrency ?? ""}

Retrieval (semantic matches):
${hitsContext(hits)}

Return JSON: { "notes": string|null, "blocks": [ { "id": string, "title": string, "intent": string, "productIds": string[] } ] }
Use 3–8 blocks. IDs must be stable slugs like "intro", "event", "catering".`;

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const j = parseJsonObject<PlanJson>(res.response.text());
  const blocks = (j.blocks ?? []).map(
    (b) =>
      new ProposalBlockPlan(
        b.id || "block",
        b.title || "Section",
        b.intent || "",
        Array.isArray(b.productIds) ? b.productIds : [],
      ),
  );
  return new ProposalPlan(blocks, j.notes ?? null);
}

export function planProposalFallback(
  extracted: ExtractedRequirements,
  hits: SearchHit[],
): ProposalPlan {
  const ids = [...new Set(hits.map((h) => h.chunk.productId))].slice(0, 8);
  return new ProposalPlan(
    [
      new ProposalBlockPlan("intro", "Introduction", "Set context", []),
      new ProposalBlockPlan(
        "recommendations",
        "Recommended services",
        `Address: ${extracted.summary.slice(0, 120)}`,
        ids,
      ),
      new ProposalBlockPlan("next", "Next steps", "Closing", []),
    ],
    "Fallback plan (Gemini unavailable).",
  );
}
