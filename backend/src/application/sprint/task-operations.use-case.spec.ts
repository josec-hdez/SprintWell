import { Sprint } from '../../domain/sprint/sprint.js';
import type { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { Task } from '../../domain/sprint/task.js';
import { AddTaskUseCase } from './add-task.use-case.js';
import { ChangeTaskStatusUseCase } from './change-task-status.use-case.js';
import { RemoveTaskUseCase } from './remove-task.use-case.js';
import { InvalidTransitionError, TaskNotFoundError } from './sprint.errors.js';

function sprintWithTask(): Sprint {
  return Sprint.create({
    id: 's1',
    name: 'S',
    startDate: new Date('2026-05-04'),
    durationDays: 5,
    tasks: [Task.create({ id: 't1', name: 'T', effortDays: 1, category: 'feature', domain: 'd' })],
  });
}

describe('Task operation use cases', () => {
  const findById = jest.fn();
  const save = jest.fn();
  const sprints = { findById, save } as unknown as SprintRepository;

  beforeEach(() => {
    findById.mockReset();
    save.mockReset();
  });

  it('AddTaskUseCase adds a task to the sprint', async () => {
    findById.mockResolvedValue(sprintWithTask());
    const task = await new AddTaskUseCase(sprints).execute({
      sprintId: 's1',
      name: 'New',
      effortDays: 2,
      category: 'bug',
      domain: 'd',
    });
    expect(task.effortDays).toBe(2);
    const saved = save.mock.calls[0]?.[0] as Sprint;
    expect(saved.tasks).toHaveLength(2);
  });

  it('RemoveTaskUseCase throws for an unknown task', async () => {
    findById.mockResolvedValue(sprintWithTask());
    await expect(new RemoveTaskUseCase(sprints).execute('s1', 'ghost')).rejects.toBeInstanceOf(
      TaskNotFoundError,
    );
  });

  it('ChangeTaskStatusUseCase applies a legal transition', async () => {
    findById.mockResolvedValue(sprintWithTask());
    await new ChangeTaskStatusUseCase(sprints).execute({
      sprintId: 's1',
      taskId: 't1',
      status: 'IN_PROGRESS',
    });
    const saved = save.mock.calls[0]?.[0] as Sprint;
    expect(saved.findTask('t1')?.status.value).toBe('IN_PROGRESS');
  });

  it('ChangeTaskStatusUseCase rejects an illegal transition (TODO → DONE)', async () => {
    findById.mockResolvedValue(sprintWithTask());
    await expect(
      new ChangeTaskStatusUseCase(sprints).execute({
        sprintId: 's1',
        taskId: 't1',
        status: 'DONE',
      }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
    expect(save).not.toHaveBeenCalled();
  });
});
