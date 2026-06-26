import { RuleSet } from '../rule-set.js';
import { RuleType } from '../rule-type.js';
import { Rule } from '../rule.js';
import { Weight } from '../weight.js';
import { ConflictValidator } from './conflict-validator.js';

function rule(id: string, type: string, params: Record<string, unknown>, enabled = true): Rule {
  return Rule.create({
    id,
    ownerId: 'u1',
    type: RuleType.of(type),
    params,
    weight: Weight.of(10),
    isHard: false,
    enabled,
  });
}

describe('ConflictValidator', () => {
  it('detects a cross category conflict (PREFER + AVOID same category)', () => {
    const set = RuleSet.create('u1', [
      rule('r1', 'PREFER_CATEGORY', { category: 'sre' }),
      rule('r2', 'AVOID_CATEGORY', { category: 'sre' }),
    ]);
    const conflicts = ConflictValidator.detect(set);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.ruleIds).toEqual(['r1', 'r2']);
    expect(conflicts[0]?.value).toBe('sre');
    expect(ConflictValidator.hasConflicts(set)).toBe(true);
  });

  it('detects skill and weekday conflicts too', () => {
    const set = RuleSet.create('u1', [
      rule('r1', 'PREFER_SKILL', { skill_id: 'py' }),
      rule('r2', 'AVOID_SKILL', { skill_id: 'py' }),
      rule('r3', 'PREFER_WEEKDAY', { weekday: 'saturday' }),
      rule('r4', 'AVOID_WEEKDAY', { weekday: 'saturday' }),
    ]);
    expect(ConflictValidator.detect(set)).toHaveLength(2);
  });

  it('does not flag prefer/avoid on different targets', () => {
    const set = RuleSet.create('u1', [
      rule('r1', 'PREFER_CATEGORY', { category: 'sre' }),
      rule('r2', 'AVOID_CATEGORY', { category: 'bug' }),
    ]);
    expect(ConflictValidator.detect(set)).toEqual([]);
  });

  it('ignores disabled rules', () => {
    const set = RuleSet.create('u1', [
      rule('r1', 'PREFER_CATEGORY', { category: 'sre' }),
      rule('r2', 'AVOID_CATEGORY', { category: 'sre' }, false),
    ]);
    expect(ConflictValidator.hasConflicts(set)).toBe(false);
  });

  it('returns no conflicts for a consistent set', () => {
    const set = RuleSet.create('u1', [
      rule('r1', 'PREFER_SKILL', { skill_id: 'py' }),
      rule('r2', 'PREFER_CATEGORY', { category: 'feature' }),
    ]);
    expect(ConflictValidator.detect(set)).toEqual([]);
  });
});
