// Integration test for PrismaSprintRepository against real Postgres (issue #53).
// Excluded from CI; run with `npm run test:integration`.

import { Sprint } from '@domain/sprint/sprint.js';
import { Task } from '@domain/sprint/task.js';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service.js';
import { PrismaSprintRepository } from '@infrastructure/persistence/repositories/prisma-sprint.repository.js';

describe('PrismaSprintRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaSprintRepository(prisma);
  const sprintId = `it-sprint-${Date.now()}`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.sprint.deleteMany({ where: { id: sprintId } });
    await prisma.$disconnect();
  });

  it('saves a sprint with a task and reads it back', async () => {
    const sprint = Sprint.create({
      id: sprintId,
      name: 'Integration sprint',
      startDate: new Date('2026-05-04'),
      durationDays: 10,
      tasks: [
        Task.create({
          id: `${sprintId}-t1`,
          name: 'T1',
          effortDays: 2,
          category: 'FEATURE',
          domain: 'auth',
        }),
      ],
    });
    await repository.save(sprint);

    const loaded = await repository.findById(sprintId);
    expect(loaded?.tasks).toHaveLength(1);
    expect(loaded?.findTask(`${sprintId}-t1`)?.effortDays).toBe(2);
    expect(loaded?.findTask(`${sprintId}-t1`)?.status.value).toBe('TODO');
  });

  it('persists a task status change', async () => {
    const sprint = await repository.findById(sprintId);
    expect(sprint).not.toBeNull();
    await repository.save(sprint!.changeTaskStatus(`${sprintId}-t1`, 'IN_PROGRESS'));

    const reloaded = await repository.findById(sprintId);
    expect(reloaded?.findTask(`${sprintId}-t1`)?.status.value).toBe('IN_PROGRESS');
  });

  it('deletes the sprint (cascading its tasks)', async () => {
    await repository.delete(sprintId);
    expect(await repository.findById(sprintId)).toBeNull();
  });
});
