// Delete a sprint (admin) — issue #52.

import { Injectable } from '@nestjs/common';

import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { SprintNotFoundError } from './sprint.errors.js';

@Injectable()
export class DeleteSprintUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(sprintId: string): Promise<void> {
    const sprint = await this.sprints.findById(sprintId);
    if (sprint === null) {
      throw new SprintNotFoundError(sprintId);
    }
    await this.sprints.delete(sprintId);
  }
}
