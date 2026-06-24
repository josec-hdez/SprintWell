// List sprints (public read) — issue #52.

import { Injectable } from '@nestjs/common';

import { Sprint } from '../../domain/sprint/sprint.js';
import { SprintRepository } from '../../domain/sprint/sprint.repository.js';

@Injectable()
export class ListSprintsUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  execute(): Promise<Sprint[]> {
    return this.sprints.findAll();
  }
}
