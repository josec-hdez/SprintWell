import { Credentials } from '../../domain/identity/credentials.js';
import type { PasswordHasher } from '../../domain/identity/password-hasher.js';
import { Role } from '../../domain/identity/role.js';
import type { TokenIssuer } from '../../domain/identity/token-issuer.js';
import { User } from '../../domain/identity/user.js';
import type { UserRepository } from '../../domain/identity/user.repository.js';
import { InvalidCredentialsError } from './identity.errors.js';
import { LoginUseCase } from './login.use-case.js';

describe('LoginUseCase', () => {
  const user = User.create({
    id: 'u1',
    name: 'Alice',
    credentials: Credentials.create('a@b.com', 'stored-hash'),
    role: Role.admin(),
  });

  const findByEmail = jest.fn();
  const verify = jest.fn();
  const issue = jest.fn();

  const users = { findByEmail, findById: jest.fn(), save: jest.fn() } as unknown as UserRepository;
  const hasher = { hash: jest.fn(), verify } as unknown as PasswordHasher;
  const tokens = { issue } as unknown as TokenIssuer;
  const useCase = new LoginUseCase(users, hasher, tokens);

  beforeEach(() => {
    findByEmail.mockReset();
    verify.mockReset();
    issue.mockReset();
  });

  it('issues a JWT with the user claims on valid credentials', async () => {
    findByEmail.mockResolvedValue(user);
    verify.mockResolvedValue(true);
    issue.mockResolvedValue('signed.jwt.token');

    await expect(useCase.execute({ email: 'a@b.com', password: 'secret' })).resolves.toEqual({
      accessToken: 'signed.jwt.token',
    });
    expect(verify).toHaveBeenCalledWith('stored-hash', 'secret');
    expect(issue).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.com', role: 'ADMIN' });
  });

  it('rejects a wrong password without issuing a token', async () => {
    findByEmail.mockResolvedValue(user);
    verify.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'a@b.com', password: 'wrong' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(issue).not.toHaveBeenCalled();
  });

  it('rejects an unknown user without checking the password', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'nobody@b.com', password: 'x' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(verify).not.toHaveBeenCalled();
  });
});
