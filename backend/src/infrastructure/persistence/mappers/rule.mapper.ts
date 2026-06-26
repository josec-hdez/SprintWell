// Domain ↔ Prisma mapper for the Rule entity (issue #59).
//
// §14.1: Prisma types stop here. The Prisma RuleType enum values match the
// domain RuleType values (UPPER), and `params` is a JSONB column.

import type { Prisma, Rule as PrismaRule, RuleType as PrismaRuleType } from '@prisma/client';

import { RuleType } from '../../../domain/rules/rule-type.js';
import { Rule } from '../../../domain/rules/rule.js';
import { Weight } from '../../../domain/rules/weight.js';

export class RuleMapper {
  static toDomain(row: PrismaRule): Rule {
    return Rule.create({
      id: row.id,
      ownerId: row.ownerId,
      type: RuleType.of(row.type),
      params: (row.params ?? {}) as Record<string, unknown>,
      weight: Weight.of(row.weight),
      isHard: row.isHard,
      enabled: row.enabled,
      schemaVersion: row.schemaVersion,
    });
  }

  static toCreateInput(rule: Rule): Prisma.RuleUncheckedCreateInput {
    return {
      id: rule.id,
      ownerId: rule.ownerId,
      type: rule.type.value as PrismaRuleType,
      params: rule.params as Prisma.InputJsonValue,
      weight: rule.weight.value,
      isHard: rule.isHard,
      enabled: rule.enabled,
      schemaVersion: rule.schemaVersion,
    };
  }

  static toUpdateInput(rule: Rule): Prisma.RuleUpdateInput {
    return {
      type: rule.type.value as PrismaRuleType,
      params: rule.params as Prisma.InputJsonValue,
      weight: rule.weight.value,
      isHard: rule.isHard,
      enabled: rule.enabled,
      schemaVersion: rule.schemaVersion,
    };
  }
}
