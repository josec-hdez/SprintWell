// Prisma adapter for the TeamRepository port — the skill catalog (issue #50).
//
// The catalog is the whole `skills` table. `save` reconciles it: skills no
// longer present are removed and the rest are upserted, in one transaction.

import { Injectable } from '@nestjs/common';

import { Skill } from '../../../domain/team/skill.js';
import { Team } from '../../../domain/team/team.js';
import { TeamRepository } from '../../../domain/team/team.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PrismaTeamRepository extends TeamRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getCatalog(): Promise<Team> {
    const rows = await this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
    return Team.create(rows.map((row) => Skill.create(row.id, row.name)));
  }

  async save(team: Team): Promise<void> {
    const ids = team.skills.map((skill) => skill.id);
    await this.prisma.$transaction([
      this.prisma.skill.deleteMany({ where: { id: { notIn: ids } } }),
      ...team.skills.map((skill) =>
        this.prisma.skill.upsert({
          where: { id: skill.id },
          create: { id: skill.id, name: skill.name },
          update: { name: skill.name },
        }),
      ),
    ]);
  }
}
