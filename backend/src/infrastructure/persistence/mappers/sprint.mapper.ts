// Domain ↔ Prisma mapper for the Sprint aggregate (issue #53).
//
// §14.1: Prisma types stop here. Maps a Sprint row (with its tasks, each with
// requiredSkills and dependsOn) to the domain aggregate. Assignments are NOT
// part of this mapping — in the schema they belong to PlanningRun, not Sprint
// (handled by the planning context, issues #60+); a CRUD-loaded sprint has none.

import type { Prisma, TaskCategory as PrismaTaskCategory } from '@prisma/client';

import { Sprint } from '../../../domain/sprint/sprint.js';
import { TaskStatus, type TaskStatusValue } from '../../../domain/sprint/task-status.js';
import { Task } from '../../../domain/sprint/task.js';

type SprintRow = Prisma.SprintGetPayload<{
  include: { tasks: { include: { requiredSkills: true; dependsOn: true } } };
}>;
type TaskRow = SprintRow['tasks'][number];

export class SprintMapper {
  static toDomain(row: SprintRow): Sprint {
    return Sprint.create({
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      durationDays: row.durationDays,
      tasks: row.tasks.map((task) => SprintMapper.taskToDomain(task)),
    });
  }

  private static taskToDomain(task: TaskRow): Task {
    return Task.create({
      id: task.id,
      name: task.name,
      effortDays: task.effortDays,
      category: task.category,
      domain: task.domain,
      requiredSkills: task.requiredSkills.map((skill) => skill.id),
      dependsOn: task.dependsOn.map((dependency) => dependency.id),
      status: TaskStatus.of(task.status as TaskStatusValue),
      // Omit deadlineDay when null (exactOptionalPropertyTypes).
      ...(task.deadlineDay !== null ? { deadlineDay: task.deadlineDay } : {}),
    });
  }

  static taskToCreateInput(sprintId: string, task: Task): Prisma.TaskCreateManyInput {
    return {
      id: task.id,
      sprintId,
      name: task.name,
      effortDays: task.effortDays,
      category: task.category as PrismaTaskCategory,
      domain: task.domain,
      deadlineDay: task.deadlineDay,
      status: task.status.value,
    };
  }
}
