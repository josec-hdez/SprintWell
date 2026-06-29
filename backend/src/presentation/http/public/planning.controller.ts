// Public (no-auth) read of planning runs (issue #63, brief §10.1).

import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { GetPlanningRunUseCase } from '../../../application/planning/get-planning-run.use-case.js';
import { ListSprintRunsUseCase } from '../../../application/planning/list-sprint-runs.use-case.js';
import { type PlanningRunView, toPlanningRunView } from '../../../application/planning/views.js';

@ApiTags('public: planning')
@Controller()
export class PlanningPublicController {
  constructor(
    private readonly getPlanningRun: GetPlanningRunUseCase,
    private readonly listSprintRuns: ListSprintRunsUseCase,
  ) {}

  @Get('planning-runs/:id')
  async get(@Param('id') id: string): Promise<PlanningRunView> {
    return toPlanningRunView(await this.getPlanningRun.execute(id));
  }

  @Get('sprints/:sprintId/planning-runs')
  async listForSprint(@Param('sprintId') sprintId: string): Promise<PlanningRunView[]> {
    const runs = await this.listSprintRuns.execute(sprintId);
    return runs.map(toPlanningRunView);
  }
}
