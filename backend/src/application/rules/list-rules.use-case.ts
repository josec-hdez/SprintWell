// List an owner's rules (issue #58). Rules are team-visible info (brief §10.1),
// so reading is not access-restricted.

import { Injectable } from '@nestjs/common';

import { Rule } from '../../domain/rules/rule.js';
import { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';

@Injectable()
export class ListRulesUseCase {
  constructor(private readonly ruleSets: RuleSetRepository) {}

  async execute(ownerId: string): Promise<readonly Rule[]> {
    const ruleSet = await this.ruleSets.findByOwner(ownerId);
    return ruleSet.rules;
  }
}
