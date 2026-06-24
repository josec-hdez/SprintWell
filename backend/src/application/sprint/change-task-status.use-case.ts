// Change a task's status, enforcing the domain transitions — issue #52.
//
// Shared by the admin endpoint (any task) and the member endpoint (own tasks,
// issue #54); ownership is checked by the caller, the transition legality here.

import { Injectable } from '@nestjs/common';

import type { TaskStatusValue } from '../../domain/sprint/task-status.js';
import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { InvalidTransitionError, SprintNotFoundError, TaskNotFoundError } from './sprint.errors.js';

export interface ChangeTaskStatusCommand {
  sprintId: string;
  taskId: string;
  status: TaskStatusValue;
}

@Injectable()
export class ChangeTaskStatusUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(command: ChangeTaskStatusCommand): Promise<void> {
    const sprint = await this.sprints.findById(command.sprintId);
    if (sprint === null) {
      throw new SprintNotFoundError(command.sprintId);
    }
    const task = sprint.findTask(command.taskId);
    if (task === undefined) {
      throw new TaskNotFoundError(command.taskId);
    }
    if (!task.status.canTransitionTo(command.status)) {
      throw new InvalidTransitionError(task.status.value, command.status);
    }
    await this.sprints.save(sprint.changeTaskStatus(command.taskId, command.status));
  }
}
