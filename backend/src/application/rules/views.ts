// Application-layer read views for the Rules context (issue #59).

import type { Rule } from '../../domain/rules/rule.js';

// Re-exported so presentation can name conflict results without importing
// domain directly (§14.1: presentation → application only).
export type { RuleConflict } from '../../domain/rules/policies/conflict-validator.js';

export interface RuleView {
  id: string;
  ownerId: string;
  type: string;
  params: Record<string, unknown>;
  weight: number;
  isHard: boolean;
  enabled: boolean;
  schemaVersion: number;
}

export function toRuleView(rule: Rule): RuleView {
  return {
    id: rule.id,
    ownerId: rule.ownerId,
    type: rule.type.value,
    params: rule.params,
    weight: rule.weight.value,
    isHard: rule.isHard,
    enabled: rule.enabled,
    schemaVersion: rule.schemaVersion,
  };
}
