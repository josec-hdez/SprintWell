// Application-layer errors for the Rules context (issue #58).

import type { RuleConflict } from '../../domain/rules/policies/conflict-validator.js';

/** Raised when a member tries to manage rules they do not own (→ 403). */
export class RuleAuthorizationError extends Error {
  constructor(ownerId: string) {
    super(`You may only manage your own rules (owner ${ownerId}).`);
    this.name = 'RuleAuthorizationError';
  }
}

/** Raised when saving would leave the rule set with antagonistic pairs (→ 409). */
export class RuleConflictError extends Error {
  constructor(public readonly conflicts: readonly RuleConflict[]) {
    super(`Rule set has ${conflicts.length} unresolved conflict(s).`);
    this.name = 'RuleConflictError';
  }
}

/** Raised when a rule id is not present in the owner's set (→ 404). */
export class RuleNotFoundError extends Error {
  constructor(ruleId: string) {
    super(`Rule not found: ${ruleId}.`);
    this.name = 'RuleNotFoundError';
  }
}
