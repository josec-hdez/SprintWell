// Presentation module for planning endpoints — admin launch + public read (#63).

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { GetPlanningRunUseCase } from '../../application/planning/get-planning-run.use-case.js';
import { LaunchPlanningUseCase } from '../../application/planning/launch-planning.use-case.js';
import { ListSprintRunsUseCase } from '../../application/planning/list-sprint-runs.use-case.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { PlanningAdminController } from './admin/planning.controller.js';
import { PlanningPublicController } from './public/planning.controller.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';

@Module({
  imports: [JwtModule.register({ secret: JWT_SECRET })],
  controllers: [PlanningAdminController, PlanningPublicController],
  providers: [LaunchPlanningUseCase, GetPlanningRunUseCase, ListSprintRunsUseCase, AdminGuard],
})
export class PlanningHttpModule {}
