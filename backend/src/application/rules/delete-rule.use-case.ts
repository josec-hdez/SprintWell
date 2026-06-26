// Delete a rule from an owner's set (issue #58).

import { Injectable } from '@nestjs/common';

import { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';
import { type Actor, assertCanManageRules } from './rule-authorization.js';
import { RuleNotFoundError } from './rules.errors.js';

export interface DeleteRuleCommand {
  actor: Actor;
  ownerId: string;
  ruleId: string;
}

@Injectable()
export class DeleteRuleUseCase {
  constructor(private readonly ruleSets: RuleSetRepository) {}

  async execute(command: DeleteRuleCommand): Promise<void> {
    assertCanManageRules(command.actor, command.ownerId);
    const ruleSet = await this.ruleSets.findByOwner(command.ownerId);
    if (!ruleSet.hasRule(command.ruleId)) {
      throw new RuleNotFoundError(command.ruleId);
    }
    await this.ruleSets.save(ruleSet.withoutRule(command.ruleId));
  }
}
