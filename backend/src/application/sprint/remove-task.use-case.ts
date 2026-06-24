// Remove a task from a sprint (admin) — issue #52.

import { Injectable } from '@nestjs/common';

import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { SprintNotFoundError, TaskNotFoundError } from './sprint.errors.js';

@Injectable()
export class RemoveTaskUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(sprintId: string, taskId: string): Promise<void> {
    const sprint = await this.sprints.findById(sprintId);
    if (sprint === null) {
      throw new SprintNotFoundError(sprintId);
    }
    if (sprint.findTask(taskId) === undefined) {
      throw new TaskNotFoundError(taskId);
    }
    await this.sprints.save(sprint.withoutTask(taskId));
  }
}
