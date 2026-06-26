// Create or update a rule in an owner's set (issue #58).
//
// Authorizes the actor, applies the change, then rejects if the resulting set
// still has antagonistic pairs (brief §6.4) — the set must be conflict-free to
// persist. Budget overflow is rejected by the RuleSet aggregate itself.

import { Injectable } from '@nestjs/common';

import { ConflictValidator } from '../../domain/rules/policies/conflict-validator.js';
import { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';
import { RuleType } from '../../domain/rules/rule-type.js';
import { Rule } from '../../domain/rules/rule.js';
import { Weight } from '../../domain/rules/weight.js';
import { type Actor, assertCanManageRules } from './rule-authorization.js';
import { RuleConflictError } from './rules.errors.js';

export interface UpsertRuleCommand {
  actor: Actor;
  ownerId: string;
  ruleId: string;
  type: string;
  params: Record<string, unknown>;
  weight: number;
  isHard: boolean;
  enabled?: boolean;
}

@Injectable()
export class UpsertRuleUseCase {
  constructor(private readonly ruleSets: RuleSetRepository) {}

  async execute(command: UpsertRuleCommand): Promise<void> {
    assertCanManageRules(command.actor, command.ownerId);

    const current = await this.ruleSets.findByOwner(command.ownerId);
    const rule = Rule.create({
      id: command.ruleId,
      ownerId: command.ownerId,
      type: RuleType.of(command.type),
      params: command.params,
      weight: Weight.of(command.weight),
      isHard: command.isHard,
      ...(command.enabled !== undefined ? { enabled: command.enabled } : {}),
    });

    const base = current.hasRule(command.ruleId) ? current.withoutRule(command.ruleId) : current;
    const next = base.withRule(rule);

    const conflicts = ConflictValidator.detect(next);
    if (conflicts.length > 0) {
      throw new RuleConflictError(conflicts);
    }
    await this.ruleSets.save(next);
  }
}
