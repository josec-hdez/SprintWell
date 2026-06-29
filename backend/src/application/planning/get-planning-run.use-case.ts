// Get a planning run by id (public read) — issue #63.

import { Injectable } from '@nestjs/common';

import { PlanningRun } from '../../domain/planning/planning-run.js';
import { PlanningRunRepository } from '../../domain/planning/planning-run.repository.js';
import { PlanningRunNotFoundError } from './planning.errors.js';

@Injectable()
export class GetPlanningRunUseCase {
  constructor(private readonly planningRuns: PlanningRunRepository) {}

  async execute(runId: string): Promise<PlanningRun> {
    const run = await this.planningRuns.findById(runId);
    if (run === null) {
      throw new PlanningRunNotFoundError(runId);
    }
    return run;
  }
}
