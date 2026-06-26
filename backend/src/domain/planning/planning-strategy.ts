// Pure-TypeScript value object for the planning algorithm (issue #60).
//
// §14.1: framework-agnostic. The three algorithms compared in the benchmark
// (brief §8): the CP-SAT optimiser and the random / greedy baselines.

export type PlanningStrategyValue = 'CPSAT' | 'RANDOM' | 'GREEDY';

const ALL: readonly PlanningStrategyValue[] = ['CPSAT', 'RANDOM', 'GREEDY'];

export class PlanningStrategy {
  private constructor(public readonly value: PlanningStrategyValue) {
    Object.freeze(this);
  }

  static of(value: string): PlanningStrategy {
    if (!ALL.includes(value as PlanningStrategyValue)) {
      throw new Error(`Invalid planning strategy: ${value}.`);
    }
    return new PlanningStrategy(value as PlanningStrategyValue);
  }

  equals(other: PlanningStrategy): boolean {
    return this.value === other.value;
  }
}
