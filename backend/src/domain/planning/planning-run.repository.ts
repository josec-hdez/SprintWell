// Domain port for PlanningRun persistence (issue #60).
//
// Abstract class per the repository convention — TS contract + DI token.
// Concrete adapter lands in infrastructure (issue #62+).

import { PlanningRun } from './planning-run.js';

export abstract class PlanningRunRepository {
  abstract findById(id: string): Promise<PlanningRun | null>;

  /** All runs for a sprint, newest first (for the comparator). */
  abstract findBySprint(sprintId: string): Promise<PlanningRun[]>;

  abstract save(run: PlanningRun): Promise<void>;
}
