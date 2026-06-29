// Application-layer read view for a PlanningRun (issue #63).

import type { PlanningRun } from '../../domain/planning/planning-run.js';

export interface PlanningRunView {
  id: string;
  sprintId: string;
  strategy: string;
  equityMode: string;
  status: string;
  objectiveValue: number | null;
  assignments: Array<{ taskId: string; userId: string; startDay: number }>;
  perUserHappiness: Array<{ userId: string; happiness: number }>;
  averageHappiness: number;
  minHappiness: number;
  createdAt: string;
}

export function toPlanningRunView(run: PlanningRun): PlanningRunView {
  return {
    id: run.id,
    sprintId: run.sprintId,
    strategy: run.strategy.value,
    equityMode: run.equityMode,
    status: run.status,
    objectiveValue: run.objectiveValue,
    assignments: run.assignments.map((a) => ({
      taskId: a.taskId,
      userId: a.userId,
      startDay: a.startDay,
    })),
    perUserHappiness: run.perUserHappiness.map((entry) => ({
      userId: entry.userId,
      happiness: entry.score.value,
    })),
    averageHappiness: run.averageHappiness(),
    minHappiness: run.minHappiness(),
    createdAt: run.createdAt.toISOString(),
  };
}
