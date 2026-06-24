// Prisma adapter for the MemberSkillRepository port (issue #50).
//
// Persists the member↔skill proficiency on the `user_skills` join table.

import { Injectable } from '@nestjs/common';

import { MemberSkillRepository } from '../../../domain/team/member-skill.repository.js';
import { SkillLevel } from '../../../domain/team/skill-level.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PrismaMemberSkillRepository extends MemberSkillRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async assign(userId: string, skillId: string, level: SkillLevel): Promise<void> {
    await this.prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      create: { userId, skillId, level: level.value },
      update: { level: level.value },
    });
  }

  async remove(userId: string, skillId: string): Promise<void> {
    await this.prisma.userSkill.deleteMany({ where: { userId, skillId } });
  }
}
