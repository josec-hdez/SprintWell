import { Credentials } from '../../domain/identity/credentials.js';
import type { PasswordHasher } from '../../domain/identity/password-hasher.js';
import { Role } from '../../domain/identity/role.js';
import { User } from '../../domain/identity/user.js';
import type { UserRepository } from '../../domain/identity/user.repository.js';
import { ChangePasswordUseCase } from './change-password.use-case.js';
import { InvalidCredentialsError, UserNotFoundError } from './identity.errors.js';

describe('ChangePasswordUseCase', () => {
  const user = User.create({
    id: 'u1',
    name: 'Alice',
    credentials: Credentials.create('a@b.com', 'old-hash'),
    role: Role.member(),
  });

  const findById = jest.fn();
  const save = jest.fn();
  const verify = jest.fn();
  const hash = jest.fn();

  const users = { findById, findByEmail: jest.fn(), save } as unknown as UserRepository;
  const hasher = { hash, verify } as unknown as PasswordHasher;
  const useCase = new ChangePasswordUseCase(users, hasher);

  beforeEach(() => {
    findById.mockReset();
    save.mockReset();
    verify.mockReset();
    hash.mockReset();
  });

  it('verifies the current password and persists the new hash', async () => {
    findById.mockResolvedValue(user);
    verify.mockResolvedValue(true);
    hash.mockResolvedValue('new-hash');

    await useCase.execute({ userId: 'u1', currentPassword: 'old', newPassword: 'new' });

    expect(verify).toHaveBeenCalledWith('old-hash', 'old');
    expect(hash).toHaveBeenCalledWith('new');
    const saved = save.mock.calls[0]?.[0] as User;
    expect(saved.credentials.passwordHash).toBe('new-hash');
    expect(saved.id).toBe('u1');
  });

  it('rejects a wrong current password without saving', async () => {
    findById.mockResolvedValue(user);
    verify.mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: 'u1', currentPassword: 'wrong', newPassword: 'new' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(save).not.toHaveBeenCalled();
  });

  it('throws when the user does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'ghost', currentPassword: 'x', newPassword: 'y' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
