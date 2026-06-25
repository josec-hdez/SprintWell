// Infrastructure wiring for the Sprint context (issue #53).
//
// @Global so presentation feature modules resolve the SprintRepository port
// without importing infrastructure (§14.1).

import { Global, Module } from '@nestjs/common';

import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { TaskAssignmentQuery } from '../../domain/sprint/task-assignment.query.js';
import { PrismaModule } from '../persistence/prisma/prisma.module.js';
import { PrismaSprintRepository } from '../persistence/repositories/prisma-sprint.repository.js';
import { PrismaTaskAssignmentQuery } from '../persistence/repositories/prisma-task-assignment.query.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    { provide: SprintRepository, useClass: PrismaSprintRepository },
    { provide: TaskAssignmentQuery, useClass: PrismaTaskAssignmentQuery },
  ],
  exports: [SprintRepository, TaskAssignmentQuery],
})
export class SprintInfrastructureModule {}
