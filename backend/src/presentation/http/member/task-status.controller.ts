// Member endpoint: change the status of one's OWN task (issue #54).
//
// MemberGuard authenticates; the use case enforces ownership (the caller must
// be the task's assignee) before applying the transition.

import { Body, Controller, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ChangeOwnTaskStatusUseCase } from '../../../application/sprint/change-own-task-status.use-case.js';
import { CurrentUser, type AuthenticatedUser } from '../../decorators/current-user.decorator.js';
import { ChangeTaskStatusDto } from '../../dto/sprint/change-task-status.dto.js';
import { MemberGuard } from '../../guards/member.guard.js';

@ApiTags('member: tasks')
@ApiBearerAuth()
@UseGuards(MemberGuard)
@Controller('tasks')
export class TaskStatusController {
  constructor(private readonly changeOwnTaskStatus: ChangeOwnTaskStatusUseCase) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeStatus(
    @Param('id') taskId: string,
    @Body() dto: ChangeTaskStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.changeOwnTaskStatus.execute({ taskId, userId: user.userId, status: dto.status });
  }
}
