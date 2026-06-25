// Pure-TypeScript value object for the rule type (issue #55).
//
// §14.1: framework-agnostic. The twelve types frozen in schema_version = 1
// (brief §6.3). BLACKOUT_DATE is always a hard rule.

export type RuleTypeValue =
  | 'PREFER_SKILL'
  | 'AVOID_SKILL'
  | 'PREFER_CATEGORY'
  | 'AVOID_CATEGORY'
  | 'PREFER_DOMAIN'
  | 'PREFER_WEEKDAY'
  | 'AVOID_WEEKDAY'
  | 'BLACKOUT_DATE'
  | 'MAX_TASKS_PER_SPRINT'
  | 'FOCUS_PREFERENCE'
  | 'COOLDOWN_AFTER'
  | 'LEARN_SKILL';

const ALL: readonly RuleTypeValue[] = [
  'PREFER_SKILL',
  'AVOID_SKILL',
  'PREFER_CATEGORY',
  'AVOID_CATEGORY',
  'PREFER_DOMAIN',
  'PREFER_WEEKDAY',
  'AVOID_WEEKDAY',
  'BLACKOUT_DATE',
  'MAX_TASKS_PER_SPRINT',
  'FOCUS_PREFERENCE',
  'COOLDOWN_AFTER',
  'LEARN_SKILL',
];

const ALWAYS_HARD: readonly RuleTypeValue[] = ['BLACKOUT_DATE'];

export class RuleType {
  private constructor(public readonly value: RuleTypeValue) {
    Object.freeze(this);
  }

  static of(value: string): RuleType {
    if (!ALL.includes(value as RuleTypeValue)) {
      throw new Error(`Invalid rule type: ${value}.`);
    }
    return new RuleType(value as RuleTypeValue);
  }

  /** Whether this type is always hard (BLACKOUT_DATE) and cannot be soft. */
  isAlwaysHard(): boolean {
    return ALWAYS_HARD.includes(this.value);
  }

  equals(other: RuleType): boolean {
    return this.value === other.value;
  }
}
