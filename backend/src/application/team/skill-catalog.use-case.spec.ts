import { Skill } from '../../domain/team/skill.js';
import { Team } from '../../domain/team/team.js';
import type { TeamRepository } from '../../domain/team/team.repository.js';
import { CreateSkillUseCase } from './create-skill.use-case.js';
import { DeleteSkillUseCase } from './delete-skill.use-case.js';
import { ListSkillsUseCase } from './list-skills.use-case.js';
import { SkillNotInCatalogError } from './team.errors.js';

describe('skill catalog use cases', () => {
  const getCatalog = jest.fn();
  const save = jest.fn();
  const team = { getCatalog, save } as unknown as TeamRepository;

  beforeEach(() => {
    getCatalog.mockReset();
    save.mockReset();
  });

  it('CreateSkillUseCase adds a named skill to the catalog', async () => {
    getCatalog.mockResolvedValue(Team.create([]));
    const skill = await new CreateSkillUseCase(team).execute('Python');

    expect(skill.name).toBe('Python');
    const saved = save.mock.calls[0]?.[0] as Team;
    expect(saved.skills.map((s) => s.name)).toEqual(['Python']);
  });

  it('ListSkillsUseCase returns the catalog skills', async () => {
    getCatalog.mockResolvedValue(Team.create([Skill.create('py', 'Python')]));
    const skills = await new ListSkillsUseCase(team).execute();
    expect(skills.map((s) => s.id)).toEqual(['py']);
  });

  it('DeleteSkillUseCase removes an existing skill', async () => {
    getCatalog.mockResolvedValue(Team.create([Skill.create('py', 'Python')]));
    await new DeleteSkillUseCase(team).execute('py');
    const saved = save.mock.calls[0]?.[0] as Team;
    expect(saved.hasSkill('py')).toBe(false);
  });

  it('DeleteSkillUseCase throws for an unknown skill', async () => {
    getCatalog.mockResolvedValue(Team.create([]));
    await expect(new DeleteSkillUseCase(team).execute('nope')).rejects.toBeInstanceOf(
      SkillNotInCatalogError,
    );
    expect(save).not.toHaveBeenCalled();
  });
});
