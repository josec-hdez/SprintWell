// Prisma adapter for the SprintRepository port (issue #53).
//
// A Sprint persists as a `sprints` row plus its `tasks` (with requiredSkills
// and dependsOn m:n links). `save` reconciles the task set inside a transaction
// in two phases: upsert task scalars + required skills first, then wire the
// self-referential dependsOn links once every target task row exists.

import { Injectable } from '@nestjs/common';
import type { TaskCategory as PrismaTaskCategory } from '@prisma/client';

import { Sprint } from '../../../domain/sprint/sprint.js';
import { SprintRepository } from '../../../domain/sprint/sprint.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SprintMapper } from '../mappers/sprint.mapper.js';

const TASK_INCLUDE = { tasks: { include: { requiredSkills: true, dependsOn: true } } } as const;

@Injectable()
export class PrismaSprintRepository extends SprintRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Sprint | null> {
    const row = await this.prisma.sprint.findUnique({ where: { id }, include: TASK_INCLUDE });
    return row ? SprintMapper.toDomain(row) : null;
  }

  async findAll(): Promise<Sprint[]> {
    const rows = await this.prisma.sprint.findMany({
      include: TASK_INCLUDE,
      orderBy: { startDate: 'asc' },
    });
    return rows.map((row) => SprintMapper.toDomain(row));
  }

  async save(sprint: Sprint): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.sprint.upsert({
        where: { id: sprint.id },
        create: {
          id: sprint.id,
          name: sprint.name,
          startDate: sprint.startDate,
          durationDays: sprint.durationDays,
        },
        update: {
          name: sprint.name,
          startDate: sprint.startDate,
          durationDays: sprint.durationDays,
        },
      });

      const taskIds = sprint.tasks.map((task) => task.id);
      await tx.task.deleteMany({ where: { sprintId: sprint.id, id: { notIn: taskIds } } });

      // Phase 1 — scalars + required skills (dependsOn deferred to phase 2).
      for (const task of sprint.tasks) {
        const scalars = SprintMapper.taskToCreateInput(sprint.id, task);
        const requiredSkills = { set: task.requiredSkills.map((id) => ({ id })) };
        await tx.task.upsert({
          where: { id: task.id },
          create: {
            ...scalars,
            requiredSkills: { connect: task.requiredSkills.map((id) => ({ id })) },
          },
          update: {
            name: task.name,
            effortDays: task.effortDays,
            category: task.category as PrismaTaskCategory,
            domain: task.domain,
            deadlineDay: task.deadlineDay,
            status: task.status.value,
            requiredSkills,
          },
        });
      }

      // Phase 2 — dependsOn links (every referenced task row now exists).
      for (const task of sprint.tasks) {
        await tx.task.update({
          where: { id: task.id },
          data: { dependsOn: { set: task.dependsOn.map((id) => ({ id })) } },
        });
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sprint.deleteMany({ where: { id } });
  }
}
