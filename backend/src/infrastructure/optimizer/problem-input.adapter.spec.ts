import { Rule } from '../../domain/rules/rule.js';
import { RuleType } from '../../domain/rules/rule-type.js';
import { Weight } from '../../domain/rules/weight.js';
import type { SolverRequest } from '../../domain/planning/planning-solver.js';
import { Sprint } from '../../domain/sprint/sprint.js';
import { Task } from '../../domain/sprint/task.js';
import { ProblemInputAdapter, type WireSolverOutput } from './problem-input.adapter.js';

function request(): SolverRequest {
  return {
    sprint: Sprint.create({
      id: 's1',
      name: 'Sprint 1',
      startDate: new Date('2026-05-04'),
      durationDays: 10,
      tasks: [
        Task.create({ id: 't1', name: 'T1', effortDays: 2, category: 'FEATURE', domain: 'auth' }),
      ],
    }),
    members: [{ id: 'u1', name: 'Alice', skills: [{ skillId: 'py', level: 4 }] }],
    skills: [{ id: 'py', name: 'Python' }],
    rules: [
      Rule.create({
        id: 'r1',
        ownerId: 'u1',
        type: RuleType.of('PREFER_CATEGORY'),
        params: { category: 'feature' },
        weight: Weight.of(30),
        isHard: false,
      }),
    ],
    equityMode: 'UTILITARIAN',
    strategy: 'CPSAT',
  };
}

describe('ProblemInputAdapter.toProblemInput', () => {
  it('maps the domain to the optimizer wire contract', () => {
    const wire = ProblemInputAdapter.toProblemInput(request());

    expect(wire.sprint).toEqual({
      id: 's1',
      name: 'Sprint 1',
      start_date: '2026-05-04',
      duration_days: 10,
    });
    expect(wire.users[0]?.skills).toEqual([{ skill_id: 'py', level: 4 }]);
    expect(wire.tasks[0]?.category).toBe('feature'); // lowered for the wire
    expect(wire.tasks[0]?.status).toBe('TODO');
    expect(wire.rules[0]).toMatchObject({
      id: 'r1',
      owner_id: 'u1',
      type: 'PREFER_CATEGORY',
      weight: 30,
      is_hard: false,
      schema_version: 1,
    });
    expect(wire.equity_mode).toBe('UTILITARIAN');
    expect(wire.time_budget_s).toBe(30);
  });
});

describe('ProblemInputAdapter.toResult', () => {
  it('maps the solver output back to the domain', () => {
    const output: WireSolverOutput = {
      status: 'OPTIMAL',
      objective_value: 5,
      assignments: [{ task_id: 't1', user_id: 'u1', start_day: 0 }],
      per_user_happiness: [{ user_id: 'u1', f_j: 0.8 }],
      message: null,
    };
    const result = ProblemInputAdapter.toResult(output);

    expect(result.status).toBe('OPTIMAL');
    expect(result.objectiveValue).toBe(5);
    expect(result.assignments[0]?.startDay).toBe(0);
    expect(result.perUserHappiness[0]?.score.value).toBeCloseTo(0.8);
  });
});
