// List a sprint's planning runs, newest first (public read) — issue #63.

import { Injectable } from '@nestjs/common';

import { PlanningRun } from '../../domain/planning/planning-run.js';
import { PlanningRunRepository } from '../../domain/planning/planning-run.repository.js';

@Injectable()
export class ListSprintRunsUseCase {
  constructor(private readonly planningRuns: PlanningRunRepository) {}

  execute(sprintId: string): Promise<PlanningRun[]> {
    return this.planningRuns.findBySprint(sprintId);
  }
}
