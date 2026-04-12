import type { ExtractedRequirements } from "@/models/rfp";
import type { ProposalDraft } from "@/models/proposal";
import { DimensionScore, ScoreCard } from "@/models/evaluation";
import { getGeminiModel } from "@/llm_brain/client";
import { parseJsonObject } from "@/llm_brain/json_utils";

type EvalJson = {
  dimensions?: { name: string; score: number; max: number; rationale: string }[];
  overall?: number;
  summary?: string;
};

export async function evaluateProposalLlm(
  extracted: ExtractedRequirements,
  draft: ProposalDraft,
): Promise<ScoreCard> {
  const model = getGeminiModel();
  const body = draft.blocks.map((b) => b.bodyMarkdown).join("\n\n");
  const prompt = `Score the proposal against the RFP. Return JSON:
{
  "dimensions": [ { "name": string, "score": number, "max": number, "rationale": string } ],
  "overall": number (0-100),
  "summary": string
}

Use dimensions like: completeness, product_relevance, coherence, budget_alignment.

RFP:
${extracted.rawText.slice(0, 6000)}

Proposal:
${body.slice(0, 8000)}`;

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const j = parseJsonObject<EvalJson>(res.response.text());
  const dims = (j.dimensions ?? []).map(
    (d) =>
      new DimensionScore(
        d.name ?? "dimension",
        d.score ?? 0,
        d.max ?? 10,
        d.rationale ?? "",
      ),
  );
  return new ScoreCard(
    dims,
    j.overall ?? 0,
    j.summary ?? "",
  );
}

export function evaluateProposalHeuristic(
  extracted: ExtractedRequirements,
  draft: ProposalDraft,
): ScoreCard {
  const text = draft.blocks.map((b) => b.bodyMarkdown).join("\n");
  const hasGuest =
    extracted.guestCount != null &&
    text.includes(String(extracted.guestCount));
  const dims = [
    new DimensionScore(
      "completeness",
      draft.blocks.length >= 2 ? 7 : 4,
      10,
      "Block count heuristic.",
    ),
    new DimensionScore(
      "requirement_coverage",
      hasGuest ? 8 : 5,
      10,
      "Guest count mention heuristic.",
    ),
  ];
  const overall = Math.round(
    dims.reduce((s, d) => s + (d.score / d.max) * 50, 0),
  );
  return new ScoreCard(
    dims,
    overall,
    "Heuristic evaluation (no Gemini).",
  );
}
