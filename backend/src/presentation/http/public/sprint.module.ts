// Public sprint read endpoints (issue #53). No guard — anonymous access.

import { Module } from '@nestjs/common';

import { GetSprintUseCase } from '../../../application/sprint/get-sprint.use-case.js';
import { ListSprintsUseCase } from '../../../application/sprint/list-sprints.use-case.js';
import { SprintPublicController } from './sprint.controller.js';

@Module({
  controllers: [SprintPublicController],
  providers: [ListSprintsUseCase, GetSprintUseCase],
})
export class SprintPublicModule {}
