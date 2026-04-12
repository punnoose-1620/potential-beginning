import type { ExtractedRequirements } from "@/models/rfp";
import type { ProposalDraft } from "@/models/proposal";
import type { ScoreCard } from "@/models/evaluation";
import { hasGeminiKey } from "@/llm_brain/client";
import {
  evaluateProposalHeuristic,
  evaluateProposalLlm,
} from "@/llm_brain/evaluate_proposal";

export async function runEvaluation(
  extracted: ExtractedRequirements,
  draft: ProposalDraft,
): Promise<ScoreCard> {
  if (!hasGeminiKey()) {
    return evaluateProposalHeuristic(extracted, draft);
  }
  try {
    return await evaluateProposalLlm(extracted, draft);
  } catch {
    return evaluateProposalHeuristic(extracted, draft);
  }
}
