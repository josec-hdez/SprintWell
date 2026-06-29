// Integration test for LaunchPlanningUseCase against the REAL optimizer (issue
// #62). Uses in-memory fakes for the data repos and the real OptimizerHttpClient,
// so it exercises the full Domain→ProblemInput→HTTP→PlanningRun round-trip.
//
// Excluded from CI; run with the optimizer up:
//   (cd optimizer && uv run uvicorn --app-dir src api:app --port 8000) &
//   cd backend && npm run test:integration

import { RuleSet } from '@domain/rules/rule-set.js';
import { MemberDirectory } from '@domain/planning/member-directory.js';
import { PlanningRun } from '@domain/planning/planning-run.js';
import { PlanningRunRepository } from '@domain/planning/planning-run.repository.js';
import { Sprint } from '@domain/sprint/sprint.js';
import { SprintRepository } from '@domain/sprint/sprint.repository.js';
import { Task } from '@domain/sprint/task.js';
import { Team } from '@domain/team/team.js';
import { TeamRepository } from '@domain/team/team.repository.js';
import { RuleSetRepository } from '@domain/rules/rule-set.repository.js';
import { LaunchPlanningUseCase } from '@application/planning/launch-planning.use-case.js';
import { OptimizerHttpClient } from '@infrastructure/optimizer/optimizer.client.js';

describe('LaunchPlanningUseCase (integration, real optimizer)', () => {
  const sprint = Sprint.create({
    id: 's-int',
    name: 'Integration sprint',
    startDate: new Date('2026-05-04'),
    durationDays: 5,
    tasks: [Task.create({ id: 't1', name: 'T1', effortDays: 1, category: 'FEATURE', domain: 'd' })],
  });

  const saved: PlanningRun[] = [];

  const useCase = new LaunchPlanningUseCase(
    { findById: async () => sprint } as unknown as SprintRepository,
    {
      findAllWithSkills: async () => [{ id: 'u1', name: 'Alice', skills: [] }],
    } as unknown as MemberDirectory,
    { getCatalog: async () => Team.create([]) } as unknown as TeamRepository,
    {
      findByOwner: async (owner: string) => RuleSet.create(owner, []),
    } as unknown as RuleSetRepository,
    new OptimizerHttpClient(),
    {
      save: async (run: PlanningRun) => {
        saved.push(run);
      },
    } as unknown as PlanningRunRepository,
  );

  it('plans a feasible sprint end to end and persists the run', async () => {
    const run = await useCase.execute({
      sprintId: 's-int',
      strategy: 'CPSAT',
      equityMode: 'UTILITARIAN',
      timeBudgetSeconds: 5,
    });

    expect(['OPTIMAL', 'FEASIBLE']).toContain(run.status);
    expect(run.assignments).toHaveLength(1);
    expect(run.assignments[0]?.taskId).toBe('t1');
    expect(saved).toHaveLength(1);
  });
});
