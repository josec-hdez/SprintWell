// Domain policy that detects antagonistic rules in a RuleSet (issue #57).
//
// §14.1: pure TypeScript. Brief §6.4 requires the backend to surface conflicts
// before sending rules to the optimizer (a conflicting PREFER+AVOID on the same
// target can destabilise the solver, risk §15). A conflict is two ENABLED rules
// that prefer and avoid the SAME target (skill / category / weekday).

import { RuleSet } from '../rule-set.js';
import type { Rule } from '../rule.js';
import type { RuleTypeValue } from '../rule-type.js';

export interface RuleConflict {
  ruleIds: [string, string];
  target: 'skill' | 'category' | 'weekday';
  value: string;
  description: string;
}

interface Antagonism {
  prefer: RuleTypeValue;
  avoid: RuleTypeValue;
  paramKey: string;
  target: RuleConflict['target'];
}

const ANTAGONISMS: readonly Antagonism[] = [
  { prefer: 'PREFER_SKILL', avoid: 'AVOID_SKILL', paramKey: 'skill_id', target: 'skill' },
  { prefer: 'PREFER_CATEGORY', avoid: 'AVOID_CATEGORY', paramKey: 'category', target: 'category' },
  { prefer: 'PREFER_WEEKDAY', avoid: 'AVOID_WEEKDAY', paramKey: 'weekday', target: 'weekday' },
];

export class ConflictValidator {
  /** Return every antagonistic pair in the rule set (empty when consistent). */
  static detect(ruleSet: RuleSet): RuleConflict[] {
    const enabled = ruleSet.rules.filter((rule) => rule.enabled);
    const conflicts: RuleConflict[] = [];

    for (const antagonism of ANTAGONISMS) {
      const prefers = enabled.filter((rule) => rule.type.value === antagonism.prefer);
      const avoids = enabled.filter((rule) => rule.type.value === antagonism.avoid);
      for (const prefer of prefers) {
        for (const avoid of avoids) {
          if (ConflictValidator.sameTarget(prefer, avoid, antagonism.paramKey)) {
            const value = String(prefer.params[antagonism.paramKey]);
            conflicts.push({
              ruleIds: [prefer.id, avoid.id],
              target: antagonism.target,
              value,
              description: `${antagonism.prefer} and ${antagonism.avoid} both target ${antagonism.target} "${value}".`,
            });
          }
        }
      }
    }
    return conflicts;
  }

  /** Whether a rule set has at least one antagonistic pair. */
  static hasConflicts(ruleSet: RuleSet): boolean {
    return ConflictValidator.detect(ruleSet).length > 0;
  }

  private static sameTarget(prefer: Rule, avoid: Rule, paramKey: string): boolean {
    const value = prefer.params[paramKey];
    return value !== undefined && value === avoid.params[paramKey];
  }
}
