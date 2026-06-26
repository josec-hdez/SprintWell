// Integration test for PrismaRuleSetRepository against real Postgres (issue #59).
// Excluded from CI; run with `npm run test:integration`.

import { RuleSet } from '@domain/rules/rule-set.js';
import { RuleType } from '@domain/rules/rule-type.js';
import { Rule } from '@domain/rules/rule.js';
import { Weight } from '@domain/rules/weight.js';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service.js';
import { PrismaRuleSetRepository } from '@infrastructure/persistence/repositories/prisma-rule-set.repository.js';

describe('PrismaRuleSetRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaRuleSetRepository(prisma);
  const ownerId = `it-owner-${Date.now()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `${ownerId}@x.com`,
        name: 'Owner',
        passwordHash: 'h',
        role: 'MEMBER',
      },
    });
  });

  afterAll(async () => {
    await prisma.rule.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  function rule(id: string, weight: number): Rule {
    return Rule.create({
      id: `${ownerId}-${id}`,
      ownerId,
      type: RuleType.of('PREFER_CATEGORY'),
      params: { category: 'feature' },
      weight: Weight.of(weight),
      isHard: false,
    });
  }

  it('saves a rule set and reads it back', async () => {
    await repository.save(RuleSet.create(ownerId, [rule('r1', 30)]));
    const loaded = await repository.findByOwner(ownerId);
    expect(loaded.rules).toHaveLength(1);
    expect(loaded.budgetUsed()).toBe(30);
  });

  it('reconciles the set on save (removes dropped rules)', async () => {
    await repository.save(RuleSet.create(ownerId, [rule('r1', 30), rule('r2', 20)]));
    await repository.save(RuleSet.create(ownerId, [rule('r2', 20)]));
    const loaded = await repository.findByOwner(ownerId);
    expect(loaded.rules.map((r) => r.id)).toEqual([`${ownerId}-r2`]);
  });
});
