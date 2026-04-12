import type { ExtractedRequirements } from "@/models/rfp";
import type { ProposalDraft } from "@/models/proposal";
import { SelfReviewResult } from "@/models/pipeline";
import { getGeminiModel } from "@/llm_brain/client";
import { parseJsonObject } from "@/llm_brain/json_utils";

type ReviewJson = { gaps?: string[]; suggestions?: string[] };

export async function selfReviewProposal(
  extracted: ExtractedRequirements,
  draft: ProposalDraft,
): Promise<SelfReviewResult> {
  const model = getGeminiModel();
  const body = draft.blocks
    .map((b) => `## ${b.title}\n${b.bodyMarkdown}`)
    .join("\n\n");
  const prompt = `Compare this proposal draft to the original RFP needs. Return JSON only:
{ "gaps": string[], "suggestions": string[] }

Original RFP excerpt:
${extracted.rawText.slice(0, 4000)}

Proposal:
${body.slice(0, 8000)}`;

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const j = parseJsonObject<ReviewJson>(res.response.text());
  return new SelfReviewResult(j.gaps ?? [], j.suggestions ?? []);
}

export function selfReviewFallback(): SelfReviewResult {
  return new SelfReviewResult(
    ["Gemini self-review skipped (no API key)."],
    ["Configure GEMINI_API_KEY for automated gap analysis."],
  );
}
