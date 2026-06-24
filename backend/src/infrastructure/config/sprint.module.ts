// Infrastructure wiring for the Sprint context (issue #53).
//
// @Global so presentation feature modules resolve the SprintRepository port
// without importing infrastructure (§14.1).

import { Global, Module } from '@nestjs/common';

import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { PrismaModule } from '../persistence/prisma/prisma.module.js';
import { PrismaSprintRepository } from '../persistence/repositories/prisma-sprint.repository.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [{ provide: SprintRepository, useClass: PrismaSprintRepository }],
  exports: [SprintRepository],
})
export class SprintInfrastructureModule {}
