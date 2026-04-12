/**
 * A product row from Proposales content library (subset used by the app).
 */
export class ContentProduct {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly metadata: Record<string, unknown>,
  ) {}
}
