// Prisma adapter for the PlanningRunRepository port (issue #63).

import { Injectable } from '@nestjs/common';

import { PlanningRun } from '../../../domain/planning/planning-run.js';
import { PlanningRunRepository } from '../../../domain/planning/planning-run.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlanningRunMapper } from '../mappers/planning-run.mapper.js';

@Injectable()
export class PrismaPlanningRunRepository extends PlanningRunRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<PlanningRun | null> {
    const row = await this.prisma.planningRun.findUnique({
      where: { id },
      include: { assignments: true },
    });
    return row ? PlanningRunMapper.toDomain(row) : null;
  }

  async findBySprint(sprintId: string): Promise<PlanningRun[]> {
    const rows = await this.prisma.planningRun.findMany({
      where: { sprintId },
      include: { assignments: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => PlanningRunMapper.toDomain(row));
  }

  async save(run: PlanningRun): Promise<void> {
    await this.prisma.planningRun.create({ data: PlanningRunMapper.toCreateInput(run) });
  }
}
