import { RuleSet } from '../../domain/rules/rule-set.js';
import type { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';
import { HappinessScore } from '../../domain/planning/happiness-score.js';
import type { MemberDirectory } from '../../domain/planning/member-directory.js';
import { PlanningRun } from '../../domain/planning/planning-run.js';
import type { PlanningRunRepository } from '../../domain/planning/planning-run.repository.js';
import type { PlanningSolver, SolverResult } from '../../domain/planning/planning-solver.js';
import { Assignment } from '../../domain/sprint/assignment.js';
import { Sprint } from '../../domain/sprint/sprint.js';
import type { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { Team } from '../../domain/team/team.js';
import type { TeamRepository } from '../../domain/team/team.repository.js';
import { LaunchPlanningUseCase } from './launch-planning.use-case.js';
import { SprintNotFoundError } from '../sprint/sprint.errors.js';

describe('LaunchPlanningUseCase', () => {
  const findById = jest.fn();
  const findAllWithSkills = jest.fn();
  const getCatalog = jest.fn();
  const findByOwner = jest.fn();
  const solve = jest.fn();
  const save = jest.fn();

  const useCase = new LaunchPlanningUseCase(
    { findById } as unknown as SprintRepository,
    { findAllWithSkills } as unknown as MemberDirectory,
    { getCatalog } as unknown as TeamRepository,
    { findByOwner } as unknown as RuleSetRepository,
    { solve } as unknown as PlanningSolver,
    { save } as unknown as PlanningRunRepository,
  );

  beforeEach(() => {
    findById.mockReset();
    findAllWithSkills.mockReset();
    getCatalog.mockReset();
    findByOwner.mockReset();
    solve.mockReset();
    save.mockReset();
  });

  const solverResult: SolverResult = {
    status: 'OPTIMAL',
    objectiveValue: 12,
    assignments: [Assignment.create('t1', 'u1', 0)],
    perUserHappiness: [{ userId: 'u1', score: HappinessScore.of(0.7) }],
    message: null,
  };

  it('orchestrates sprint + rules → optimizer → persisted PlanningRun', async () => {
    findById.mockResolvedValue(
      Sprint.create({ id: 's1', name: 'S', startDate: new Date('2026-05-04'), durationDays: 5 }),
    );
    findAllWithSkills.mockResolvedValue([{ id: 'u1', name: 'Alice', skills: [] }]);
    getCatalog.mockResolvedValue(Team.create([]));
    findByOwner.mockResolvedValue(RuleSet.create('u1', []));
    solve.mockResolvedValue(solverResult);

    const run = await useCase.execute({
      sprintId: 's1',
      strategy: 'CPSAT',
      equityMode: 'UTILITARIAN',
    });

    expect(solve).toHaveBeenCalledTimes(1);
    expect(run).toBeInstanceOf(PlanningRun);
    const saved = save.mock.calls[0]?.[0] as PlanningRun;
    expect(saved.status).toBe('OPTIMAL');
    expect(saved.strategy.value).toBe('CPSAT');
    expect(saved.assignments).toHaveLength(1);
    expect(saved.averageHappiness()).toBeCloseTo(0.7);
  });

  it('throws when the sprint does not exist', async () => {
    findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ sprintId: 'ghost', strategy: 'CPSAT', equityMode: 'UTILITARIAN' }),
    ).rejects.toBeInstanceOf(SprintNotFoundError);
    expect(solve).not.toHaveBeenCalled();
  });
});
