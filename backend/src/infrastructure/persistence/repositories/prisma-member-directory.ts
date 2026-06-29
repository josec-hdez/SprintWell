// Prisma adapter for the MemberDirectory port (issue #63).
//
// Projects every user with their skill levels (the `user_skills` join) into the
// solver's member shape.

import { Injectable } from '@nestjs/common';

import { MemberDirectory } from '../../../domain/planning/member-directory.js';
import type { SolverMember } from '../../../domain/planning/planning-solver.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PrismaMemberDirectory extends MemberDirectory {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAllWithSkills(): Promise<SolverMember[]> {
    const users = await this.prisma.user.findMany({
      include: { skills: true },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      skills: user.skills.map((skill) => ({ skillId: skill.skillId, level: skill.level })),
    }));
  }
}
