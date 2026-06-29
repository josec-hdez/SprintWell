// Domain ↔ Prisma mapper for the PlanningRun aggregate (issue #63).
//
// §14.1: Prisma types stop here. A PlanningRun persists as a `planning_runs`
// row plus its `assignments`. Per-user happiness is stored as JSONB. Enum values
// (strategy/equityMode/status) match the Prisma enums (UPPER).

import type {
  EquityMode as PrismaEquityMode,
  PlanningStrategy as PrismaPlanningStrategy,
  Prisma,
  RunStatus as PrismaRunStatus,
} from '@prisma/client';

import { HappinessScore } from '../../../domain/planning/happiness-score.js';
import {
  PlanningRun,
  type EquityModeValue,
  type RunStatusValue,
  type UserHappiness,
} from '../../../domain/planning/planning-run.js';
import { PlanningStrategy } from '../../../domain/planning/planning-strategy.js';
import { Assignment } from '../../../domain/sprint/assignment.js';

type PlanningRunRow = Prisma.PlanningRunGetPayload<{ include: { assignments: true } }>;

interface StoredHappiness {
  userId: string;
  fJ: number;
}

export class PlanningRunMapper {
  static toDomain(row: PlanningRunRow): PlanningRun {
    const stored = (row.perUserHappiness ?? []) as unknown as StoredHappiness[];
    const perUserHappiness: UserHappiness[] = stored.map((entry) => ({
      userId: entry.userId,
      score: HappinessScore.of(entry.fJ),
    }));
    return PlanningRun.create({
      id: row.id,
      sprintId: row.sprintId,
      strategy: PlanningStrategy.of(row.strategy),
      equityMode: row.equityMode as EquityModeValue,
      status: row.status as RunStatusValue,
      objectiveValue: row.objectiveValue,
      assignments: row.assignments.map((a) => Assignment.create(a.taskId, a.userId, a.startDay)),
      perUserHappiness,
      createdAt: row.createdAt,
    });
  }

  static toCreateInput(run: PlanningRun): Prisma.PlanningRunUncheckedCreateInput {
    const perUserHappiness: StoredHappiness[] = run.perUserHappiness.map((entry) => ({
      userId: entry.userId,
      fJ: entry.score.value,
    }));
    return {
      id: run.id,
      sprintId: run.sprintId,
      strategy: run.strategy.value as PrismaPlanningStrategy,
      equityMode: run.equityMode as PrismaEquityMode,
      status: run.status as PrismaRunStatus,
      objectiveValue: run.objectiveValue,
      perUserHappiness: perUserHappiness as unknown as Prisma.InputJsonValue,
      createdAt: run.createdAt,
      assignments: {
        create: run.assignments.map((a) => ({
          taskId: a.taskId,
          userId: a.userId,
          startDay: a.startDay,
        })),
      },
    };
  }
}
