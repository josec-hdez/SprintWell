import { Sprint } from '../../domain/sprint/sprint.js';
import type { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { CreateSprintUseCase } from './create-sprint.use-case.js';
import { DeleteSprintUseCase } from './delete-sprint.use-case.js';
import { GetSprintUseCase } from './get-sprint.use-case.js';
import { ListSprintsUseCase } from './list-sprints.use-case.js';
import { SprintNotFoundError } from './sprint.errors.js';

function makeSprint(id: string): Sprint {
  return Sprint.create({ id, name: id, startDate: new Date('2026-05-04'), durationDays: 5 });
}

describe('Sprint management use cases', () => {
  const findById = jest.fn();
  const findAll = jest.fn();
  const save = jest.fn();
  const del = jest.fn();
  const sprints = { findById, findAll, save, delete: del } as unknown as SprintRepository;

  beforeEach(() => {
    findById.mockReset();
    findAll.mockReset();
    save.mockReset();
    del.mockReset();
  });

  it('CreateSprintUseCase persists a valid sprint', async () => {
    const sprint = await new CreateSprintUseCase(sprints).execute({
      name: 'Sprint 1',
      startDate: new Date('2026-05-04'),
      durationDays: 5,
    });
    expect(sprint.durationDays).toBe(5);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('ListSprintsUseCase returns all sprints', async () => {
    findAll.mockResolvedValue([makeSprint('s1'), makeSprint('s2')]);
    expect(await new ListSprintsUseCase(sprints).execute()).toHaveLength(2);
  });

  it('GetSprintUseCase throws for an unknown sprint', async () => {
    findById.mockResolvedValue(null);
    await expect(new GetSprintUseCase(sprints).execute('ghost')).rejects.toBeInstanceOf(
      SprintNotFoundError,
    );
  });

  it('DeleteSprintUseCase deletes an existing sprint', async () => {
    findById.mockResolvedValue(makeSprint('s1'));
    await new DeleteSprintUseCase(sprints).execute('s1');
    expect(del).toHaveBeenCalledWith('s1');
  });
});
