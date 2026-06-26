// Preview the conflicts in an owner's rule set (issue #58).
//
// Read-only: lets the frontend show antagonistic pairs so the user can resolve
// them before planning (brief §6.4).

import { Injectable } from '@nestjs/common';

import {
  ConflictValidator,
  type RuleConflict,
} from '../../domain/rules/policies/conflict-validator.js';
import { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';

@Injectable()
export class ValidateRuleSetUseCase {
  constructor(private readonly ruleSets: RuleSetRepository) {}

  async execute(ownerId: string): Promise<RuleConflict[]> {
    const ruleSet = await this.ruleSets.findByOwner(ownerId);
    return ConflictValidator.detect(ruleSet);
  }
}
