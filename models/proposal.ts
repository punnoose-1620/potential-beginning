import type { ContentProduct } from "@/models/content";

/** One planned section before generation */
export class ProposalBlockPlan {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly intent: string,
    public readonly productIds: string[],
  ) {}
}

/** Full structural plan for a proposal */
export class ProposalPlan {
  constructor(
    public readonly blocks: ProposalBlockPlan[],
    public readonly notes: string | null,
  ) {}
}

/** Generated copy for a single block */
export class GeneratedBlock {
  constructor(
    public readonly blockId: string,
    public readonly title: string,
    public readonly bodyMarkdown: string,
    public readonly citedProducts: ContentProduct[],
  ) {}
}

/** Draft ready for API assembly (payload shape is mapped in controllers) */
export class ProposalDraft {
  constructor(
    public readonly title: string,
    public readonly blocks: GeneratedBlock[],
  ) {}
}
