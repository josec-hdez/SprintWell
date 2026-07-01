// Member task-status endpoint (issue #54). MemberGuard-protected.

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChangeOwnTaskStatusUseCase } from '../../../application/sprint/change-own-task-status.use-case.js';
import { ListMyTasksUseCase } from '../../../application/sprint/list-my-tasks.use-case.js';
import { MemberGuard } from '../../guards/member.guard.js';
import { MyTasksController } from './my-tasks.controller.js';
import { TaskStatusController } from './task-status.controller.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';

@Module({
  imports: [JwtModule.register({ secret: JWT_SECRET })],
  controllers: [TaskStatusController, MyTasksController],
  providers: [ChangeOwnTaskStatusUseCase, ListMyTasksUseCase, MemberGuard],
})
export class MemberTaskModule {}
