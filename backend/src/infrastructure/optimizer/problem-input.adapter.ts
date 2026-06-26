// Domain ↔ optimizer wire-contract adapter (issue #61).
//
// §14.1: the optimizer's JSON contract (ProblemInput / SolverOutput, snake_case,
// lower-case category wire values) is known ONLY here. Task categories are
// stored upper-case in the backend and lowered for the wire; rule params are
// already in wire shape (validated against the shared JSON Schema, #56).

import { Assignment } from '../../domain/sprint/assignment.js';
import { HappinessScore } from '../../domain/planning/happiness-score.js';
import type { RunStatusValue, UserHappiness } from '../../domain/planning/planning-run.js';
import type { SolverRequest, SolverResult } from '../../domain/planning/planning-solver.js';

interface WireRule {
  id: string;
  owner_id: string;
  type: string;
  params: Record<string, unknown>;
  weight: number;
  is_hard: boolean;
  enabled: boolean;
  schema_version: number;
}

export interface WireProblemInput {
  sprint: { id: string; name: string; start_date: string; duration_days: number };
  users: Array<{ id: string; name: string; skills: Array<{ skill_id: string; level: number }> }>;
  tasks: Array<{
    id: string;
    name: string;
    effort_days: number;
    required_skills: string[];
    category: string;
    domain: string;
    deadline_day: number | null;
    depends_on: string[];
    status: string;
  }>;
  skills: Array<{ id: string; name: string }>;
  rules: WireRule[];
  equity_mode: string;
  time_budget_s: number;
}

export interface WireSolverOutput {
  status: string;
  objective_value: number | null;
  assignments: Array<{ task_id: string; user_id: string; start_day: number }>;
  per_user_happiness: Array<{ user_id: string; f_j: number }>;
  message: string | null;
}

const DEFAULT_TIME_BUDGET_S = 30;

export class ProblemInputAdapter {
  static toProblemInput(request: SolverRequest): WireProblemInput {
    const sprint = request.sprint;
    return {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        start_date: sprint.startDate.toISOString().slice(0, 10),
        duration_days: sprint.durationDays,
      },
      users: request.members.map((member) => ({
        id: member.id,
        name: member.name,
        skills: member.skills.map((skill) => ({ skill_id: skill.skillId, level: skill.level })),
      })),
      tasks: sprint.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        effort_days: task.effortDays,
        required_skills: [...task.requiredSkills],
        category: task.category.toLowerCase(),
        domain: task.domain,
        deadline_day: task.deadlineDay,
        depends_on: [...task.dependsOn],
        status: task.status.value,
      })),
      skills: request.skills.map((skill) => ({ id: skill.id, name: skill.name })),
      rules: request.rules.map((rule) => ({
        id: rule.id,
        owner_id: rule.ownerId,
        type: rule.type.value,
        params: rule.params,
        weight: rule.weight.value,
        is_hard: rule.isHard,
        enabled: rule.enabled,
        schema_version: rule.schemaVersion,
      })),
      equity_mode: request.equityMode,
      time_budget_s: request.timeBudgetSeconds ?? DEFAULT_TIME_BUDGET_S,
    };
  }

  static toResult(output: WireSolverOutput): SolverResult {
    const perUserHappiness: UserHappiness[] = output.per_user_happiness.map((entry) => ({
      userId: entry.user_id,
      score: HappinessScore.of(entry.f_j),
    }));
    return {
      status: output.status as RunStatusValue,
      objectiveValue: output.objective_value,
      assignments: output.assignments.map((a) =>
        Assignment.create(a.task_id, a.user_id, a.start_day),
      ),
      perUserHappiness,
      message: output.message,
    };
  }
}
