// Member-facing status change with an ownership check (issue #54).
//
// The route carries only a task id, so the use case resolves the assignee and
// the owning sprint, verifies the caller owns the task, then applies the same
// transition rules as the admin path.

import { Injectable } from '@nestjs/common';

import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { TaskAssignmentQuery } from '../../domain/sprint/task-assignment.query.js';
import type { TaskStatusValue } from '../../domain/sprint/task-status.js';
import { InvalidTransitionError, TaskNotFoundError, TaskOwnershipError } from './sprint.errors.js';

export interface ChangeOwnTaskStatusCommand {
  taskId: string;
  userId: string;
  status: TaskStatusValue;
}

@Injectable()
export class ChangeOwnTaskStatusUseCase {
  constructor(
    private readonly sprints: SprintRepository,
    private readonly assignments: TaskAssignmentQuery,
  ) {}

  async execute(command: ChangeOwnTaskStatusCommand): Promise<void> {
    const assignee = await this.assignments.findAssignee(command.taskId);
    if (assignee !== command.userId) {
      throw new TaskOwnershipError(command.taskId);
    }

    const sprint = await this.sprints.findByTaskId(command.taskId);
    const task = sprint?.findTask(command.taskId);
    if (sprint === null || task === undefined) {
      throw new TaskNotFoundError(command.taskId);
    }
    if (!task.status.canTransitionTo(command.status)) {
      throw new InvalidTransitionError(task.status.value, command.status);
    }
    await this.sprints.save(sprint.changeTaskStatus(command.taskId, command.status));
  }
}
