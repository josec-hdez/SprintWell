// Pure-TypeScript Rule entity — a single preference (issue #55).
//
// §14.1: framework-agnostic. Mirrors the brief §6.1 envelope. `params` is an
// opaque object here; its per-type shape is validated against the JSON Schema
// in a separate concern (issue #56). BLACKOUT_DATE cannot be soft (§6.3).

import { RuleType } from './rule-type.js';
import { Weight } from './weight.js';

export interface RuleProps {
  id: string;
  ownerId: string;
  type: RuleType;
  params: Record<string, unknown>;
  weight: Weight;
  isHard: boolean;
  enabled?: boolean;
  schemaVersion?: number;
}

export class Rule {
  private constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly type: RuleType,
    public readonly params: Record<string, unknown>,
    public readonly weight: Weight,
    public readonly isHard: boolean,
    public readonly enabled: boolean,
    public readonly schemaVersion: number,
  ) {
    Object.freeze(this);
  }

  static create(props: RuleProps): Rule {
    if (props.id.trim().length === 0) {
      throw new Error('Rule requires a non-empty id.');
    }
    if (props.ownerId.trim().length === 0) {
      throw new Error('Rule requires a non-empty owner id.');
    }
    if (props.type.isAlwaysHard() && !props.isHard) {
      throw new Error(`${props.type.value} rules must be hard.`);
    }
    return new Rule(
      props.id,
      props.ownerId,
      props.type,
      Object.freeze({ ...props.params }),
      props.weight,
      props.isHard,
      props.enabled ?? true,
      props.schemaVersion ?? 1,
    );
  }

  /** Soft, enabled rules are the ones that consume budget (brief §6.2). */
  countsTowardBudget(): boolean {
    return this.enabled && !this.isHard;
  }
}
