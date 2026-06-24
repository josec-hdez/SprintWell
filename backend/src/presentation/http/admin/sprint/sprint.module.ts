// Admin sprint/task CRUD endpoints (issue #53). AdminGuard-protected.

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AddTaskUseCase } from '../../../../application/sprint/add-task.use-case.js';
import { ChangeTaskStatusUseCase } from '../../../../application/sprint/change-task-status.use-case.js';
import { CreateSprintUseCase } from '../../../../application/sprint/create-sprint.use-case.js';
import { DeleteSprintUseCase } from '../../../../application/sprint/delete-sprint.use-case.js';
import { RemoveTaskUseCase } from '../../../../application/sprint/remove-task.use-case.js';
import { AdminGuard } from '../../../guards/admin.guard.js';
import { SprintAdminController } from './sprint.controller.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';

@Module({
  imports: [JwtModule.register({ secret: JWT_SECRET })],
  controllers: [SprintAdminController],
  providers: [
    CreateSprintUseCase,
    DeleteSprintUseCase,
    AddTaskUseCase,
    RemoveTaskUseCase,
    ChangeTaskStatusUseCase,
    AdminGuard,
  ],
})
export class SprintAdminModule {}
