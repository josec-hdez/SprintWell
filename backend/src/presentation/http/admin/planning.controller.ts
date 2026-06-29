// Admin endpoint to launch a planning run for a sprint (issue #63).

import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LaunchPlanningUseCase } from '../../../application/planning/launch-planning.use-case.js';
import { type PlanningRunView, toPlanningRunView } from '../../../application/planning/views.js';
import { LaunchPlanningDto } from '../../dto/planning/launch-planning.dto.js';
import { AdminGuard } from '../../guards/admin.guard.js';

@ApiTags('admin: planning')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/sprints/:sprintId/planning-runs')
export class PlanningAdminController {
  constructor(private readonly launchPlanning: LaunchPlanningUseCase) {}

  @Post()
  async launch(
    @Param('sprintId') sprintId: string,
    @Body() dto: LaunchPlanningDto,
  ): Promise<PlanningRunView> {
    const run = await this.launchPlanning.execute({
      sprintId,
      strategy: dto.algorithm,
      equityMode: dto.equityMode,
      ...(dto.timeBudgetSeconds !== undefined ? { timeBudgetSeconds: dto.timeBudgetSeconds } : {}),
    });
    return toPlanningRunView(run);
  }
}
