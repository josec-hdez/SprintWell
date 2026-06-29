// Integration test for PrismaPlanningRunRepository against real Postgres (#63).
// Excluded from CI; run with `npm run test:integration`.

import { HappinessScore } from '@domain/planning/happiness-score.js';
import { PlanningRun } from '@domain/planning/planning-run.js';
import { PlanningStrategy } from '@domain/planning/planning-strategy.js';
import { Assignment } from '@domain/sprint/assignment.js';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service.js';
import { PrismaPlanningRunRepository } from '@infrastructure/persistence/repositories/prisma-planning-run.repository.js';

describe('PrismaPlanningRunRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaPlanningRunRepository(prisma);
  const suffix = `${Date.now()}`;
  const sprintId = `it-sprint-${suffix}`;
  const userId = `it-user-${suffix}`;
  const taskId = `it-task-${suffix}`;
  const runId = `it-run-${suffix}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({
      data: { id: userId, email: `${userId}@x.com`, name: 'U', passwordHash: 'h', role: 'MEMBER' },
    });
    await prisma.sprint.create({
      data: {
        id: sprintId,
        name: 'S',
        startDate: new Date('2026-05-04'),
        durationDays: 5,
        tasks: {
          create: [{ id: taskId, name: 'T', effortDays: 1, category: 'FEATURE', domain: 'd' }],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.planningRun.deleteMany({ where: { sprintId } });
    await prisma.sprint.deleteMany({ where: { id: sprintId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('saves a run with assignments + happiness and reads it back', async () => {
    const run = PlanningRun.create({
      id: runId,
      sprintId,
      strategy: PlanningStrategy.of('CPSAT'),
      equityMode: 'UTILITARIAN',
      status: 'OPTIMAL',
      objectiveValue: 7,
      assignments: [Assignment.create(taskId, userId, 0)],
      perUserHappiness: [{ userId, score: HappinessScore.of(0.75) }],
      createdAt: new Date('2026-05-04T10:00:00Z'),
    });
    await repository.save(run);

    const [loaded] = await repository.findBySprint(sprintId);
    expect(loaded?.id).toBe(runId);
    expect(loaded?.assignments).toHaveLength(1);
    expect(loaded?.assignments[0]?.taskId).toBe(taskId);
    expect(loaded?.perUserHappiness[0]?.score.value).toBeCloseTo(0.75);
    expect(loaded?.objectiveValue).toBe(7);
  });
});
