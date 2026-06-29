// Infrastructure wiring for the Planning context (issue #63). @Global so the
// planning presentation module resolves the ports without importing infra.
//
// SprintRepository / TeamRepository / RuleSetRepository are already provided by
// their own @Global infrastructure modules.

import { Global, Module } from '@nestjs/common';

import { MemberDirectory } from '../../domain/planning/member-directory.js';
import { PlanningRunRepository } from '../../domain/planning/planning-run.repository.js';
import { PlanningSolver } from '../../domain/planning/planning-solver.js';
import { OptimizerHttpClient } from '../optimizer/optimizer.client.js';
import { PrismaModule } from '../persistence/prisma/prisma.module.js';
import { PrismaMemberDirectory } from '../persistence/repositories/prisma-member-directory.js';
import { PrismaPlanningRunRepository } from '../persistence/repositories/prisma-planning-run.repository.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    { provide: PlanningRunRepository, useClass: PrismaPlanningRunRepository },
    { provide: MemberDirectory, useClass: PrismaMemberDirectory },
    { provide: PlanningSolver, useClass: OptimizerHttpClient },
  ],
  exports: [PlanningRunRepository, MemberDirectory, PlanningSolver],
})
export class PlanningInfrastructureModule {}
