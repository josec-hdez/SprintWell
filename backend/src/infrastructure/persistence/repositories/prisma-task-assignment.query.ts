// Prisma adapter for the TaskAssignmentQuery port (issue #54).
//
// Reads the `assignments` table (populated by planning runs) to find who a task
// is assigned to. Returns the most recent assignment's user when several runs
// exist for the task's sprint.

import { Injectable } from '@nestjs/common';

import { TaskAssignmentQuery } from '../../../domain/sprint/task-assignment.query.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PrismaTaskAssignmentQuery extends TaskAssignmentQuery {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAssignee(taskId: string): Promise<string | null> {
    const assignment = await this.prisma.assignment.findFirst({
      where: { taskId },
      orderBy: { planningRun: { createdAt: 'desc' } },
      select: { userId: true },
    });
    return assignment?.userId ?? null;
  }
}
