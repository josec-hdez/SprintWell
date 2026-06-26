import { RuleParamsValidator } from './rule-params.validator.js';

describe('RuleParamsValidator (shared schemas)', () => {
  const validator = new RuleParamsValidator();

  it('exposes the frozen schema version 1', () => {
    expect(validator.schemaVersion).toBe(1);
  });

  it('accepts valid params per type', () => {
    expect(validator.isValid('PREFER_SKILL', { skill_id: 's1' })).toBe(true);
    expect(validator.isValid('PREFER_CATEGORY', { category: 'feature' })).toBe(true);
    expect(validator.isValid('FOCUS_PREFERENCE', {})).toBe(true);
    expect(validator.isValid('COOLDOWN_AFTER', { after_category: 'on_call', rest_days: 1 })).toBe(
      true,
    );
    expect(validator.isValid('LEARN_SKILL', { skill_id: 's1', min_tasks: 2 })).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(validator.isValid('PREFER_SKILL', {})).toBe(false);
    expect(validator.errorsFor('PREFER_SKILL', {}).length).toBeGreaterThan(0);
  });

  it('rejects wire-casing mismatches and unknown enum values', () => {
    expect(validator.isValid('PREFER_CATEGORY', { category: 'FEATURE' })).toBe(false); // wire is lower-case
    expect(validator.isValid('PREFER_WEEKDAY', { weekday: 'funday' })).toBe(false);
  });

  it('rejects extra properties (additionalProperties: false)', () => {
    expect(validator.isValid('PREFER_SKILL', { skill_id: 's1', extra: 1 })).toBe(false);
  });

  it('rejects an out-of-range integer', () => {
    expect(validator.isValid('MAX_TASKS_PER_SPRINT', { max_tasks: 0 })).toBe(false);
  });

  it('throws for an unknown rule type', () => {
    expect(() => validator.isValid('NOPE', {})).toThrow(/Unknown rule type/);
  });
});
