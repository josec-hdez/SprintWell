// Create a sprint (admin) — issue #52.

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { Sprint } from '../../domain/sprint/sprint.js';
import { SprintRepository } from '../../domain/sprint/sprint.repository.js';

export interface CreateSprintCommand {
  name: string;
  startDate: Date;
  durationDays: number;
}

@Injectable()
export class CreateSprintUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(command: CreateSprintCommand): Promise<Sprint> {
    const sprint = Sprint.create({
      id: randomUUID(),
      name: command.name,
      startDate: command.startDate,
      durationDays: command.durationDays,
    });
    await this.sprints.save(sprint);
    return sprint;
  }
}
