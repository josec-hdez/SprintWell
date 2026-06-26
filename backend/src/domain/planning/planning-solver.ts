// Domain port for invoking a planning solver (issue #61).
//
// §14.1: the domain expresses WHAT it needs solved (a sprint, its members and
// their skills, the rules, the equity mode) and WHAT comes back (status,
// objective, assignments, per-user happiness) — not HOW (HTTP, JSON, the
// optimizer's wire contract). The infrastructure client adapts and calls it.

import { Assignment } from '../sprint/assignment.js';
import { Rule } from '../rules/rule.js';
import { Sprint } from '../sprint/sprint.js';
import type { EquityModeValue, RunStatusValue, UserHappiness } from './planning-run.js';
import type { PlanningStrategyValue } from './planning-strategy.js';

export interface SolverMember {
  id: string;
  name: string;
  skills: ReadonlyArray<{ skillId: string; level: number }>;
}

export interface SolverRequest {
  sprint: Sprint;
  members: readonly SolverMember[];
  skills: ReadonlyArray<{ id: string; name: string }>;
  rules: readonly Rule[];
  equityMode: EquityModeValue;
  strategy: PlanningStrategyValue;
  timeBudgetSeconds?: number;
}

export interface SolverResult {
  status: RunStatusValue;
  objectiveValue: number | null;
  assignments: readonly Assignment[];
  perUserHappiness: readonly UserHappiness[];
  message: string | null;
}

export abstract class PlanningSolver {
  abstract solve(request: SolverRequest): Promise<SolverResult>;
}
