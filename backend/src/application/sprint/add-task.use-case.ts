// Add a task to a sprint (admin) — issue #52.

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { Task } from '../../domain/sprint/task.js';
import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { SprintNotFoundError } from './sprint.errors.js';

export interface AddTaskCommand {
  sprintId: string;
  name: string;
  effortDays: number;
  category: string;
  domain: string;
  deadlineDay?: number;
  requiredSkills?: readonly string[];
  dependsOn?: readonly string[];
}

@Injectable()
export class AddTaskUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(command: AddTaskCommand): Promise<Task> {
    const sprint = await this.sprints.findById(command.sprintId);
    if (sprint === null) {
      throw new SprintNotFoundError(command.sprintId);
    }
    const task = Task.create({
      id: randomUUID(),
      name: command.name,
      effortDays: command.effortDays,
      category: command.category,
      domain: command.domain,
      // Spread conditionally so explicit `undefined` is never passed
      // (exactOptionalPropertyTypes).
      ...(command.deadlineDay !== undefined ? { deadlineDay: command.deadlineDay } : {}),
      ...(command.requiredSkills !== undefined ? { requiredSkills: command.requiredSkills } : {}),
      ...(command.dependsOn !== undefined ? { dependsOn: command.dependsOn } : {}),
    });
    await this.sprints.save(sprint.withTask(task));
    return task;
  }
}
