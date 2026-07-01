// Member endpoint: list the authenticated member's assigned tasks (issue #75).

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  ListMyTasksUseCase,
  type MyTaskView,
} from '../../../application/sprint/list-my-tasks.use-case.js';
import { CurrentUser, type AuthenticatedUser } from '../../decorators/current-user.decorator.js';
import { MyTaskResponseDto } from '../../dto/sprint/my-task-response.dto.js';
import { MemberGuard } from '../../guards/member.guard.js';

@ApiTags('member: tasks')
@ApiBearerAuth()
@UseGuards(MemberGuard)
@Controller('me')
export class MyTasksController {
  constructor(private readonly listMyTasks: ListMyTasksUseCase) {}

  @Get('tasks')
  @ApiOkResponse({ type: [MyTaskResponseDto] })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<MyTaskView[]> {
    return this.listMyTasks.execute(user.userId);
  }
}
