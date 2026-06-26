// Prisma adapter for the RuleSetRepository port (issue #59).
//
// A RuleSet is all the `rules` rows for one owner. `save` reconciles them in a
// transaction (delete removed, upsert the rest).

import { Injectable } from '@nestjs/common';

import { RuleSet } from '../../../domain/rules/rule-set.js';
import { RuleSetRepository } from '../../../domain/rules/rule-set.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RuleMapper } from '../mappers/rule.mapper.js';

@Injectable()
export class PrismaRuleSetRepository extends RuleSetRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByOwner(ownerId: string): Promise<RuleSet> {
    const rows = await this.prisma.rule.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    });
    return RuleSet.create(
      ownerId,
      rows.map((row) => RuleMapper.toDomain(row)),
    );
  }

  async save(ruleSet: RuleSet): Promise<void> {
    const ruleIds = ruleSet.rules.map((rule) => rule.id);
    await this.prisma.$transaction([
      this.prisma.rule.deleteMany({ where: { ownerId: ruleSet.ownerId, id: { notIn: ruleIds } } }),
      ...ruleSet.rules.map((rule) =>
        this.prisma.rule.upsert({
          where: { id: rule.id },
          create: RuleMapper.toCreateInput(rule),
          update: RuleMapper.toUpdateInput(rule),
        }),
      ),
    ]);
  }
}
