// Integration tests for the Team Prisma adapters (issue #50). Real Postgres;
// excluded from CI. Run with `npm run test:integration`.

import { SkillLevel } from '@domain/team/skill-level.js';
import { Skill } from '@domain/team/skill.js';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service.js';
import { PrismaMemberSkillRepository } from '@infrastructure/persistence/repositories/prisma-member-skill.repository.js';
import { PrismaTeamRepository } from '@infrastructure/persistence/repositories/prisma-team.repository.js';

describe('Team Prisma repositories (integration)', () => {
  const prisma = new PrismaService();
  const teamRepo = new PrismaTeamRepository(prisma);
  const memberSkillRepo = new PrismaMemberSkillRepository(prisma);
  const skillId = `it-skill-${Date.now()}`;
  const userId = `it-user-${Date.now()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({
      data: { id: userId, email: `${userId}@x.com`, name: 'U', passwordHash: 'h', role: 'MEMBER' },
    });
  });

  afterAll(async () => {
    await prisma.userSkill.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.skill.deleteMany({ where: { id: skillId } });
    await prisma.$disconnect();
  });

  it('saves the catalog and reads it back', async () => {
    const before = await teamRepo.getCatalog();
    await teamRepo.save(before.withSkill(Skill.create(skillId, `Skill ${skillId}`)));

    const after = await teamRepo.getCatalog();
    expect(after.hasSkill(skillId)).toBe(true);
  });

  it('assigns and updates a member skill level (upsert)', async () => {
    await memberSkillRepo.assign(userId, skillId, SkillLevel.of(3));
    await memberSkillRepo.assign(userId, skillId, SkillLevel.of(5));

    const row = await prisma.userSkill.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });
    expect(row?.level).toBe(5);
  });

  it('removes a member skill', async () => {
    await memberSkillRepo.remove(userId, skillId);
    const row = await prisma.userSkill.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });
    expect(row).toBeNull();
  });

  it('removes a skill from the catalog via save', async () => {
    const catalog = await teamRepo.getCatalog();
    if (catalog.hasSkill(skillId)) {
      await teamRepo.save(catalog.withoutSkill(skillId));
    }
    const after = await teamRepo.getCatalog();
    expect(after.hasSkill(skillId)).toBe(false);
  });
});
