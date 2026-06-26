import { RuleSet } from '../../domain/rules/rule-set.js';
import type { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';
import { RuleType } from '../../domain/rules/rule-type.js';
import { Rule } from '../../domain/rules/rule.js';
import { Weight } from '../../domain/rules/weight.js';
import { DeleteRuleUseCase } from './delete-rule.use-case.js';
import { ListRulesUseCase } from './list-rules.use-case.js';
import { type Actor } from './rule-authorization.js';
import { RuleAuthorizationError, RuleNotFoundError } from './rules.errors.js';
import { ValidateRuleSetUseCase } from './validate-rule-set.use-case.js';

const MEMBER: Actor = { userId: 'u1', role: 'MEMBER' };

function rule(id: string, type: string, params: Record<string, unknown>): Rule {
  return Rule.create({
    id,
    ownerId: 'u1',
    type: RuleType.of(type),
    params,
    weight: Weight.of(10),
    isHard: false,
  });
}

describe('Rule management use cases', () => {
  const findByOwner = jest.fn();
  const save = jest.fn();
  const ruleSets = { findByOwner, save } as unknown as RuleSetRepository;

  beforeEach(() => {
    findByOwner.mockReset();
    save.mockReset();
  });

  it('DeleteRuleUseCase removes an owned rule', async () => {
    findByOwner.mockResolvedValue(
      RuleSet.create('u1', [rule('r1', 'PREFER_SKILL', { skill_id: 's' })]),
    );
    await new DeleteRuleUseCase(ruleSets).execute({ actor: MEMBER, ownerId: 'u1', ruleId: 'r1' });
    const saved = save.mock.calls[0]?.[0] as RuleSet;
    expect(saved.hasRule('r1')).toBe(false);
  });

  it('DeleteRuleUseCase forbids deleting another member rule', async () => {
    await expect(
      new DeleteRuleUseCase(ruleSets).execute({ actor: MEMBER, ownerId: 'u2', ruleId: 'r1' }),
    ).rejects.toBeInstanceOf(RuleAuthorizationError);
  });

  it('DeleteRuleUseCase throws for an unknown rule', async () => {
    findByOwner.mockResolvedValue(RuleSet.create('u1', []));
    await expect(
      new DeleteRuleUseCase(ruleSets).execute({ actor: MEMBER, ownerId: 'u1', ruleId: 'ghost' }),
    ).rejects.toBeInstanceOf(RuleNotFoundError);
  });

  it('ListRulesUseCase returns the owner rules', async () => {
    findByOwner.mockResolvedValue(
      RuleSet.create('u1', [rule('r1', 'PREFER_SKILL', { skill_id: 's' })]),
    );
    expect(await new ListRulesUseCase(ruleSets).execute('u1')).toHaveLength(1);
  });

  it('ValidateRuleSetUseCase returns the conflicts', async () => {
    findByOwner.mockResolvedValue(
      RuleSet.create('u1', [
        rule('r1', 'PREFER_CATEGORY', { category: 'sre' }),
        rule('r2', 'AVOID_CATEGORY', { category: 'sre' }),
      ]),
    );
    const conflicts = await new ValidateRuleSetUseCase(ruleSets).execute('u1');
    expect(conflicts).toHaveLength(1);
  });
});
