import { Sprint } from '../../domain/sprint/sprint.js';
import type { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import type { TaskAssignmentQuery } from '../../domain/sprint/task-assignment.query.js';
import { Task } from '../../domain/sprint/task.js';
import { ChangeOwnTaskStatusUseCase } from './change-own-task-status.use-case.js';
import { TaskNotFoundError, TaskOwnershipError } from './sprint.errors.js';

function sprintWithTask(): Sprint {
  return Sprint.create({
    id: 's1',
    name: 'S',
    startDate: new Date('2026-05-04'),
    durationDays: 5,
    tasks: [Task.create({ id: 't1', name: 'T', effortDays: 1, category: 'FEATURE', domain: 'd' })],
  });
}

describe('ChangeOwnTaskStatusUseCase', () => {
  const findByTaskId = jest.fn();
  const save = jest.fn();
  const findAssignee = jest.fn();
  const sprints = { findByTaskId, save } as unknown as SprintRepository;
  const assignments = { findAssignee } as unknown as TaskAssignmentQuery;
  const useCase = new ChangeOwnTaskStatusUseCase(sprints, assignments);

  beforeEach(() => {
    findByTaskId.mockReset();
    save.mockReset();
    findAssignee.mockReset();
  });

  it('changes the status of a task the member owns', async () => {
    findAssignee.mockResolvedValue('u1');
    findByTaskId.mockResolvedValue(sprintWithTask());
    await useCase.execute({ taskId: 't1', userId: 'u1', status: 'IN_PROGRESS' });
    const saved = save.mock.calls[0]?.[0] as Sprint;
    expect(saved.findTask('t1')?.status.value).toBe('IN_PROGRESS');
  });

  it('rejects a task assigned to someone else (ownership)', async () => {
    findAssignee.mockResolvedValue('other-user');
    await expect(
      useCase.execute({ taskId: 't1', userId: 'u1', status: 'IN_PROGRESS' }),
    ).rejects.toBeInstanceOf(TaskOwnershipError);
    expect(findByTaskId).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects a task with no assignment as not owned', async () => {
    findAssignee.mockResolvedValue(null);
    await expect(
      useCase.execute({ taskId: 't1', userId: 'u1', status: 'IN_PROGRESS' }),
    ).rejects.toBeInstanceOf(TaskOwnershipError);
  });

  it('throws when the owned task is not found in any sprint', async () => {
    findAssignee.mockResolvedValue('u1');
    findByTaskId.mockResolvedValue(null);
    await expect(
      useCase.execute({ taskId: 't1', userId: 'u1', status: 'IN_PROGRESS' }),
    ).rejects.toBeInstanceOf(TaskNotFoundError);
  });
});
