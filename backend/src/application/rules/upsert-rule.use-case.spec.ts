import { RuleSet } from '../../domain/rules/rule-set.js';
import type { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';
import { RuleType } from '../../domain/rules/rule-type.js';
import { Rule } from '../../domain/rules/rule.js';
import { Weight } from '../../domain/rules/weight.js';
import { type Actor } from './rule-authorization.js';
import { RuleAuthorizationError, RuleConflictError } from './rules.errors.js';
import { UpsertRuleUseCase } from './upsert-rule.use-case.js';

const MEMBER: Actor = { userId: 'u1', role: 'MEMBER' };
const ADMIN: Actor = { userId: 'admin', role: 'ADMIN' };

function avoidCategory(ownerId: string): Rule {
  return Rule.create({
    id: 'r-avoid',
    ownerId,
    type: RuleType.of('AVOID_CATEGORY'),
    params: { category: 'sre' },
    weight: Weight.of(10),
    isHard: false,
  });
}

describe('UpsertRuleUseCase', () => {
  const findByOwner = jest.fn();
  const save = jest.fn();
  const ruleSets = { findByOwner, save } as unknown as RuleSetRepository;
  const useCase = new UpsertRuleUseCase(ruleSets);

  const command = {
    ownerId: 'u1',
    ruleId: 'r1',
    type: 'PREFER_CATEGORY',
    params: { category: 'feature' },
    weight: 20,
    isHard: false,
  };

  beforeEach(() => {
    findByOwner.mockReset();
    save.mockReset();
  });

  it('lets a member upsert their own rule', async () => {
    findByOwner.mockResolvedValue(RuleSet.create('u1', []));
    await useCase.execute({ actor: MEMBER, ...command });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('lets an admin upsert anyone rule', async () => {
    findByOwner.mockResolvedValue(RuleSet.create('u1', []));
    await useCase.execute({ actor: ADMIN, ...command });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("forbids a member from editing another member's rules", async () => {
    await expect(
      useCase.execute({ actor: MEMBER, ...command, ownerId: 'u2' }),
    ).rejects.toBeInstanceOf(RuleAuthorizationError);
    expect(findByOwner).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects a change that introduces a conflict (no save)', async () => {
    findByOwner.mockResolvedValue(RuleSet.create('u1', [avoidCategory('u1')]));
    await expect(
      useCase.execute({
        actor: MEMBER,
        ownerId: 'u1',
        ruleId: 'r-prefer',
        type: 'PREFER_CATEGORY',
        params: { category: 'sre' },
        weight: 10,
        isHard: false,
      }),
    ).rejects.toBeInstanceOf(RuleConflictError);
    expect(save).not.toHaveBeenCalled();
  });

  it('replaces an existing rule with the same id', async () => {
    findByOwner.mockResolvedValue(
      RuleSet.create('u1', [
        Rule.create({
          id: 'r1',
          ownerId: 'u1',
          type: RuleType.of('PREFER_SKILL'),
          params: { skill_id: 'old' },
          weight: Weight.of(90),
          isHard: false,
        }),
      ]),
    );
    await useCase.execute({ actor: MEMBER, ...command }); // r1 → PREFER_CATEGORY weight 20
    const saved = save.mock.calls[0]?.[0] as RuleSet;
    expect(saved.rules).toHaveLength(1);
    expect(saved.budgetUsed()).toBe(20); // replaced, not added on top of 90
  });
});
