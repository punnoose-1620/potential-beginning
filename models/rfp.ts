/**
 * Structured view of an incoming RFP after LLM extraction.
 */
export class ExtractedRequirements {
  constructor(
    public readonly rawText: string,
    public readonly summary: string,
    public readonly eventType: string | null,
    public readonly guestCount: number | null,
    public readonly dateHints: string[],
    public readonly budgetCurrency: string | null,
    public readonly budgetMin: number | null,
    public readonly budgetMax: number | null,
    public readonly specialRequests: string[],
    public readonly dietaryNotes: string[],
  ) {}

  static empty(rawText: string): ExtractedRequirements {
    return new ExtractedRequirements(
      rawText,
      "",
      null,
      null,
      [],
      null,
      null,
      null,
      [],
      [],
    );
  }
}
