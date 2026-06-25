import { RuleSet } from './rule-set.js';
import { RuleType } from './rule-type.js';
import { Rule } from './rule.js';
import { Weight } from './weight.js';

function softRule(id: string, weight: number, enabled = true): Rule {
  return Rule.create({
    id,
    ownerId: 'u1',
    type: RuleType.of('PREFER_CATEGORY'),
    params: { category: 'FEATURE' },
    weight: Weight.of(weight),
    isHard: false,
    enabled,
  });
}

describe('Weight', () => {
  it('rejects out-of-range and non-integer weights', () => {
    expect(() => Weight.of(-1)).toThrow(/integer in \[0, 100\]/);
    expect(() => Weight.of(101)).toThrow(/integer in \[0, 100\]/);
    expect(() => Weight.of(10.5)).toThrow(/integer in \[0, 100\]/);
  });
});

describe('RuleType', () => {
  it('rejects unknown types and flags BLACKOUT_DATE as always hard', () => {
    expect(() => RuleType.of('NOPE')).toThrow(/Invalid rule type/);
    expect(RuleType.of('BLACKOUT_DATE').isAlwaysHard()).toBe(true);
    expect(RuleType.of('PREFER_SKILL').isAlwaysHard()).toBe(false);
  });
});

describe('Rule', () => {
  it('forbids a soft BLACKOUT_DATE', () => {
    expect(() =>
      Rule.create({
        id: 'r',
        ownerId: 'u1',
        type: RuleType.of('BLACKOUT_DATE'),
        params: { dates: ['2026-05-04'] },
        weight: Weight.zero(),
        isHard: false,
      }),
    ).toThrow(/must be hard/);
  });

  it('counts only enabled soft rules toward the budget', () => {
    expect(softRule('r', 30).countsTowardBudget()).toBe(true);
    expect(softRule('r', 30, false).countsTowardBudget()).toBe(false);
    const hard = Rule.create({
      id: 'h',
      ownerId: 'u1',
      type: RuleType.of('BLACKOUT_DATE'),
      params: {},
      weight: Weight.zero(),
      isHard: true,
    });
    expect(hard.countsTowardBudget()).toBe(false);
  });
});

describe('RuleSet budget invariant', () => {
  it('accepts a set summing to exactly 100', () => {
    const set = RuleSet.create('u1', [softRule('r1', 60), softRule('r2', 40)]);
    expect(set.budgetUsed()).toBe(100);
    expect(set.budgetRemaining()).toBe(0);
  });

  it('rejects enabled soft rules summing above 100', () => {
    expect(() => RuleSet.create('u1', [softRule('r1', 60), softRule('r2', 41)])).toThrow(
      /budget exceeded/,
    );
  });

  it('ignores disabled and hard rules in the budget', () => {
    const hard = Rule.create({
      id: 'h',
      ownerId: 'u1',
      type: RuleType.of('BLACKOUT_DATE'),
      params: {},
      weight: Weight.zero(),
      isHard: true,
    });
    const set = RuleSet.create('u1', [softRule('r1', 100), softRule('r2', 100, false), hard]);
    expect(set.budgetUsed()).toBe(100); // only r1 counts
  });

  it('rejects adding a rule that overflows the budget', () => {
    const set = RuleSet.create('u1', [softRule('r1', 80)]);
    expect(() => set.withRule(softRule('r2', 30))).toThrow(/budget exceeded/);
  });

  it('rejects a rule owned by someone else', () => {
    const foreign = Rule.create({
      id: 'x',
      ownerId: 'u2',
      type: RuleType.of('PREFER_SKILL'),
      params: { skill_id: 's' },
      weight: Weight.of(10),
      isHard: false,
    });
    expect(() => RuleSet.create('u1', [foreign])).toThrow(/belongs to u2/);
  });
});
