// Pure-TypeScript PlanningRun aggregate root (issue #60).
//
// §14.1: framework-agnostic. A persisted, IMMUTABLE record of one solver run for
// a sprint: which algorithm and equity mode, the resulting status, objective,
// assignments and per-user happiness — so runs are comparable (brief §5.2, §8.1).

import { Assignment } from '../sprint/assignment.js';
import { HappinessScore } from './happiness-score.js';
import { PlanningStrategy } from './planning-strategy.js';

export type EquityModeValue = 'UTILITARIAN' | 'MAX_MIN' | 'NASH';
export type RunStatusValue = 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'TIMEOUT';

const EQUITY_MODES: readonly EquityModeValue[] = ['UTILITARIAN', 'MAX_MIN', 'NASH'];
const RUN_STATUSES: readonly RunStatusValue[] = ['OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'TIMEOUT'];

export interface UserHappiness {
  userId: string;
  score: HappinessScore;
}

export interface PlanningRunProps {
  id: string;
  sprintId: string;
  strategy: PlanningStrategy;
  equityMode: EquityModeValue;
  status: RunStatusValue;
  objectiveValue: number | null;
  assignments: readonly Assignment[];
  perUserHappiness: readonly UserHappiness[];
  createdAt: Date;
}

export class PlanningRun {
  private constructor(
    public readonly id: string,
    public readonly sprintId: string,
    public readonly strategy: PlanningStrategy,
    public readonly equityMode: EquityModeValue,
    public readonly status: RunStatusValue,
    public readonly objectiveValue: number | null,
    public readonly assignments: readonly Assignment[],
    public readonly perUserHappiness: readonly UserHappiness[],
    public readonly createdAt: Date,
  ) {
    Object.freeze(this);
  }

  static create(props: PlanningRunProps): PlanningRun {
    if (props.id.trim().length === 0) {
      throw new Error('PlanningRun requires a non-empty id.');
    }
    if (props.sprintId.trim().length === 0) {
      throw new Error('PlanningRun requires a non-empty sprint id.');
    }
    if (!EQUITY_MODES.includes(props.equityMode)) {
      throw new Error(`Invalid equity mode: ${props.equityMode}.`);
    }
    if (!RUN_STATUSES.includes(props.status)) {
      throw new Error(`Invalid run status: ${props.status}.`);
    }
    // Mirror the solver output invariants (brief §8.1).
    if (props.status === 'INFEASIBLE' && props.objectiveValue !== null) {
      throw new Error('INFEASIBLE runs must have a null objective value.');
    }
    if (
      (props.status === 'OPTIMAL' || props.status === 'FEASIBLE') &&
      props.objectiveValue === null
    ) {
      throw new Error(`${props.status} runs must have a non-null objective value.`);
    }
    return new PlanningRun(
      props.id,
      props.sprintId,
      props.strategy,
      props.equityMode,
      props.status,
      props.objectiveValue,
      Object.freeze([...props.assignments]),
      Object.freeze([...props.perUserHappiness]),
      props.createdAt,
    );
  }

  /** Mean per-user happiness (0 when there are no users). */
  averageHappiness(): number {
    if (this.perUserHappiness.length === 0) {
      return 0;
    }
    const total = this.perUserHappiness.reduce((sum, entry) => sum + entry.score.value, 0);
    return total / this.perUserHappiness.length;
  }

  /** Lowest per-user happiness (0 when there are no users) — the Rawlsian metric. */
  minHappiness(): number {
    if (this.perUserHappiness.length === 0) {
      return 0;
    }
    return Math.min(...this.perUserHappiness.map((entry) => entry.score.value));
  }
}
