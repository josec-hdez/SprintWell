import { Credentials } from '../../domain/identity/credentials.js';
import { Role } from '../../domain/identity/role.js';
import { User } from '../../domain/identity/user.js';
import type { UserRepository } from '../../domain/identity/user.repository.js';
import type { MemberSkillRepository } from '../../domain/team/member-skill.repository.js';
import { SkillLevel } from '../../domain/team/skill-level.js';
import { Skill } from '../../domain/team/skill.js';
import { Team } from '../../domain/team/team.js';
import type { TeamRepository } from '../../domain/team/team.repository.js';
import { AssignSkillUseCase } from './assign-skill.use-case.js';
import { MemberNotFoundError, SkillNotInCatalogError } from './team.errors.js';

const member = User.create({
  id: 'u1',
  name: 'Alice',
  credentials: Credentials.create('a@b.com', 'h'),
  role: Role.member(),
});

describe('AssignSkillUseCase', () => {
  const findById = jest.fn();
  const getCatalog = jest.fn();
  const assign = jest.fn();
  const users = { findById } as unknown as UserRepository;
  const team = { getCatalog } as unknown as TeamRepository;
  const memberSkills = { assign, remove: jest.fn() } as unknown as MemberSkillRepository;
  const useCase = new AssignSkillUseCase(users, team, memberSkills);

  beforeEach(() => {
    findById.mockReset();
    getCatalog.mockReset();
    assign.mockReset();
  });

  it('assigns a valid skill + level to an existing member', async () => {
    findById.mockResolvedValue(member);
    getCatalog.mockResolvedValue(Team.create([Skill.create('py', 'Python')]));

    await useCase.execute({ userId: 'u1', skillId: 'py', level: 4 });

    expect(assign).toHaveBeenCalledTimes(1);
    const [userId, skillId, level] = assign.mock.calls[0] as [string, string, SkillLevel];
    expect(userId).toBe('u1');
    expect(skillId).toBe('py');
    expect(level.value).toBe(4);
  });

  it('rejects an unknown member', async () => {
    findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ userId: 'ghost', skillId: 'py', level: 3 }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
    expect(assign).not.toHaveBeenCalled();
  });

  it('rejects a skill not in the catalog', async () => {
    findById.mockResolvedValue(member);
    getCatalog.mockResolvedValue(Team.create([]));
    await expect(useCase.execute({ userId: 'u1', skillId: 'py', level: 3 })).rejects.toBeInstanceOf(
      SkillNotInCatalogError,
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range level before touching the repository', async () => {
    findById.mockResolvedValue(member);
    getCatalog.mockResolvedValue(Team.create([Skill.create('py', 'Python')]));
    await expect(useCase.execute({ userId: 'u1', skillId: 'py', level: 9 })).rejects.toThrow(
      /integer in \[1, 5\]/,
    );
    expect(assign).not.toHaveBeenCalled();
  });
});
