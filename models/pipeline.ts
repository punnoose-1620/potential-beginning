import type { ExtractedRequirements } from "@/models/rfp";
import type { SearchHit } from "@/models/retrieval";
import type { ProposalPlan, ProposalDraft } from "@/models/proposal";
import type { ScoreCard } from "@/models/evaluation";

/** Result of self-review step */
export class SelfReviewResult {
  constructor(
    public readonly gaps: string[],
    public readonly suggestions: string[],
  ) {}
}

/** End-to-end output from `run_pipeline` */
export class PipelineResult {
  constructor(
    public readonly extracted: ExtractedRequirements,
    public readonly retrievalHits: SearchHit[],
    public readonly plan: ProposalPlan,
    public readonly draft: ProposalDraft,
    public readonly proposalId: string | null,
    public readonly selfReview: SelfReviewResult,
    public readonly evaluation: ScoreCard,
    public readonly warnings: string[],
  ) {}
}
