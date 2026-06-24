// Get a sprint by id (public read) — issue #52.

import { Injectable } from '@nestjs/common';

import { Sprint } from '../../domain/sprint/sprint.js';
import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { SprintNotFoundError } from './sprint.errors.js';

@Injectable()
export class GetSprintUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(sprintId: string): Promise<Sprint> {
    const sprint = await this.sprints.findById(sprintId);
    if (sprint === null) {
      throw new SprintNotFoundError(sprintId);
    }
    return sprint;
  }
}
