// Domain port for RuleSet persistence (issue #55).
//
// Abstract class per the repository convention — TS contract + DI token.
// Concrete adapter lands in infrastructure (issue #58+).

import { RuleSet } from './rule-set.js';

export abstract class RuleSetRepository {
  /** The owner's rule set; an empty set when they have no rules yet. */
  abstract findByOwner(ownerId: string): Promise<RuleSet>;

  /** Persist the owner's rule set (the aggregate is the unit of consistency). */
  abstract save(ruleSet: RuleSet): Promise<void>;
}
