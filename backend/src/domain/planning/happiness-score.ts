// Pure-TypeScript value object for a happiness score f_j ∈ [0, 1] (issue #60).
//
// §14.1: framework-agnostic. Brief §7.3 — individual happiness is a fraction in
// [0, 1]. Used per user and to derive a run's aggregate metrics.

export class HappinessScore {
  static readonly MIN = 0;
  static readonly MAX = 1;

  private constructor(public readonly value: number) {
    Object.freeze(this);
  }

  static of(value: number): HappinessScore {
    if (!Number.isFinite(value) || value < HappinessScore.MIN || value > HappinessScore.MAX) {
      throw new Error(`Happiness score must be in [0, 1], got ${value}.`);
    }
    return new HappinessScore(value);
  }
}
