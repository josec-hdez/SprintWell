// Admin (AdminGuard) CRUD endpoints for sprints and their tasks (issue #53).

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AddTaskUseCase } from '../../../../application/sprint/add-task.use-case.js';
import { ChangeTaskStatusUseCase } from '../../../../application/sprint/change-task-status.use-case.js';
import { CreateSprintUseCase } from '../../../../application/sprint/create-sprint.use-case.js';
import { DeleteSprintUseCase } from '../../../../application/sprint/delete-sprint.use-case.js';
import { RemoveTaskUseCase } from '../../../../application/sprint/remove-task.use-case.js';
import {
  type SprintView,
  type TaskView,
  toSprintView,
  toTaskView,
} from '../../../../application/sprint/views.js';
import { AddTaskDto } from '../../../dto/sprint/add-task.dto.js';
import { ChangeTaskStatusDto } from '../../../dto/sprint/change-task-status.dto.js';
import { CreateSprintDto } from '../../../dto/sprint/create-sprint.dto.js';
import { AdminGuard } from '../../../guards/admin.guard.js';

@ApiTags('admin: sprints')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/sprints')
export class SprintAdminController {
  constructor(
    private readonly createSprint: CreateSprintUseCase,
    private readonly deleteSprint: DeleteSprintUseCase,
    private readonly addTask: AddTaskUseCase,
    private readonly removeTask: RemoveTaskUseCase,
    private readonly changeTaskStatus: ChangeTaskStatusUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateSprintDto): Promise<SprintView> {
    const sprint = await this.createSprint.execute({
      name: dto.name,
      startDate: new Date(dto.startDate),
      durationDays: dto.durationDays,
    });
    return toSprintView(sprint);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteSprint.execute(id);
  }

  @Post(':id/tasks')
  async addSprintTask(@Param('id') id: string, @Body() dto: AddTaskDto): Promise<TaskView> {
    const task = await this.addTask.execute({
      sprintId: id,
      name: dto.name,
      effortDays: dto.effortDays,
      category: dto.category,
      domain: dto.domain,
      ...(dto.deadlineDay !== undefined ? { deadlineDay: dto.deadlineDay } : {}),
      ...(dto.requiredSkills !== undefined ? { requiredSkills: dto.requiredSkills } : {}),
      ...(dto.dependsOn !== undefined ? { dependsOn: dto.dependsOn } : {}),
    });
    return toTaskView(task);
  }

  @Delete(':id/tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSprintTask(@Param('id') id: string, @Param('taskId') taskId: string): Promise<void> {
    await this.removeTask.execute(id, taskId);
  }

  @Patch(':id/tasks/:taskId/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeStatus(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: ChangeTaskStatusDto,
  ): Promise<void> {
    await this.changeTaskStatus.execute({ sprintId: id, taskId, status: dto.status });
  }
}
