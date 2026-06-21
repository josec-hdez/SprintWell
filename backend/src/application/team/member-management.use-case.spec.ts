import { Credentials } from '../../domain/identity/credentials.js';
import { Role } from '../../domain/identity/role.js';
import { User } from '../../domain/identity/user.js';
import type { UserRepository } from '../../domain/identity/user.repository.js';
import { DeleteMemberUseCase } from './delete-member.use-case.js';
import { ListMembersUseCase } from './list-members.use-case.js';
import { MemberNotFoundError } from './team.errors.js';

function makeUser(id: string): User {
  return User.create({
    id,
    name: id,
    credentials: Credentials.create(`${id}@x.com`, 'h'),
    role: Role.member(),
  });
}

describe('ListMembersUseCase', () => {
  it('returns all users from the repository', async () => {
    const findAll = jest.fn().mockResolvedValue([makeUser('u1'), makeUser('u2')]);
    const users = { findAll } as unknown as UserRepository;
    const result = await new ListMembersUseCase(users).execute();
    expect(result).toHaveLength(2);
  });
});

describe('DeleteMemberUseCase', () => {
  const findById = jest.fn();
  const del = jest.fn();
  const users = { findById, delete: del } as unknown as UserRepository;
  const useCase = new DeleteMemberUseCase(users);

  beforeEach(() => {
    findById.mockReset();
    del.mockReset();
  });

  it('deletes an existing member', async () => {
    findById.mockResolvedValue(makeUser('u1'));
    await useCase.execute('u1');
    expect(del).toHaveBeenCalledWith('u1');
  });

  it('throws when the member does not exist', async () => {
    findById.mockResolvedValue(null);
    await expect(useCase.execute('ghost')).rejects.toBeInstanceOf(MemberNotFoundError);
    expect(del).not.toHaveBeenCalled();
  });
});
