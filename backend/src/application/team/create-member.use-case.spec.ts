import type { PasswordHasher } from '../../domain/identity/password-hasher.js';
import type { UserRepository } from '../../domain/identity/user.repository.js';
import { User } from '../../domain/identity/user.js';
import { CreateMemberUseCase } from './create-member.use-case.js';
import { EmailAlreadyInUseError } from './team.errors.js';

describe('CreateMemberUseCase', () => {
  const findByEmail = jest.fn();
  const save = jest.fn();
  const hash = jest.fn();
  const users = {
    findByEmail,
    save,
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  } as unknown as UserRepository;
  const hasher = { hash, verify: jest.fn() } as unknown as PasswordHasher;
  const useCase = new CreateMemberUseCase(users, hasher);

  beforeEach(() => {
    findByEmail.mockReset();
    save.mockReset();
    hash.mockReset();
  });

  it('creates a member with a hashed password', async () => {
    findByEmail.mockResolvedValue(null);
    hash.mockResolvedValue('hashed');

    const user = await useCase.execute({
      email: 'New@Example.com',
      name: 'New',
      role: 'MEMBER',
      initialPassword: 'pw',
    });

    expect(hash).toHaveBeenCalledWith('pw');
    expect(user.email).toBe('new@example.com');
    expect(user.role.value).toBe('MEMBER');
    const saved = save.mock.calls[0]?.[0] as User;
    expect(saved.credentials.passwordHash).toBe('hashed');
  });

  it('rejects a duplicate email', async () => {
    findByEmail.mockResolvedValue({} as User);
    await expect(
      useCase.execute({ email: 'dup@x.com', name: 'D', role: 'MEMBER', initialPassword: 'pw' }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
    expect(save).not.toHaveBeenCalled();
  });
});
