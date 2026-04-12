/** Single scored dimension */
export class DimensionScore {
  constructor(
    public readonly name: string,
    public readonly score: number,
    public readonly max: number,
    public readonly rationale: string,
  ) {}
}

/** Full evaluation of proposal vs RFP */
export class ScoreCard {
  constructor(
    public readonly dimensions: DimensionScore[],
    public readonly overall: number,
    public readonly summary: string,
  ) {}
}
