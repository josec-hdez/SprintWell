// Pure-TypeScript RuleSet aggregate — one owner's preferences (issue #55).
//
// §14.1: framework-agnostic. Owns the budget invariant (brief §6.2): the sum of
// the weights of ENABLED, SOFT rules must not exceed 100. Hard rules and
// disabled rules do not consume budget. Immutable; mutating ops return a copy.

import { Rule } from './rule.js';

export class RuleSet {
  static readonly BUDGET = 100;

  private constructor(
    public readonly ownerId: string,
    public readonly rules: readonly Rule[],
  ) {
    Object.freeze(this);
  }

  static create(ownerId: string, rules: readonly Rule[] = []): RuleSet {
    if (ownerId.trim().length === 0) {
      throw new Error('RuleSet requires a non-empty owner id.');
    }
    for (const rule of rules) {
      if (rule.ownerId !== ownerId) {
        throw new Error(`Rule ${rule.id} belongs to ${rule.ownerId}, not ${ownerId}.`);
      }
    }
    const ruleSet = new RuleSet(ownerId, Object.freeze([...rules]));
    ruleSet.assertWithinBudget();
    return ruleSet;
  }

  /** Points consumed by enabled soft rules. */
  budgetUsed(): number {
    return this.rules
      .filter((rule) => rule.countsTowardBudget())
      .reduce((total, rule) => total + rule.weight.value, 0);
  }

  budgetRemaining(): number {
    return RuleSet.BUDGET - this.budgetUsed();
  }

  hasRule(ruleId: string): boolean {
    return this.rules.some((rule) => rule.id === ruleId);
  }

  /** Add a rule (rejecting a duplicate id, foreign owner, or budget overflow). */
  withRule(rule: Rule): RuleSet {
    if (rule.ownerId !== this.ownerId) {
      throw new Error(`Rule ${rule.id} belongs to ${rule.ownerId}, not ${this.ownerId}.`);
    }
    if (this.hasRule(rule.id)) {
      throw new Error(`Rule id already in set: ${rule.id}.`);
    }
    return RuleSet.create(this.ownerId, [...this.rules, rule]);
  }

  withoutRule(ruleId: string): RuleSet {
    if (!this.hasRule(ruleId)) {
      throw new Error(`Rule id not in set: ${ruleId}.`);
    }
    return RuleSet.create(
      this.ownerId,
      this.rules.filter((rule) => rule.id !== ruleId),
    );
  }

  private assertWithinBudget(): void {
    const used = this.budgetUsed();
    if (used > RuleSet.BUDGET) {
      throw new Error(`Soft rule budget exceeded: ${used} > ${RuleSet.BUDGET}.`);
    }
  }
}
