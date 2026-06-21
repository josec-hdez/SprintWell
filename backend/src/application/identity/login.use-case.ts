// Login use case — validate credentials and issue a JWT (issue #45).
//
// Depends only on domain ports (UserRepository, PasswordHasher, TokenIssuer);
// the concrete argon2 / JWT adapters are bound at the composition root. A
// uniform InvalidCredentialsError is thrown for both "no such user" and "wrong
// password" so the response never reveals which emails exist.

import { Injectable } from '@nestjs/common';

import { PasswordHasher } from '../../domain/identity/password-hasher.js';
import { TokenIssuer } from '../../domain/identity/token-issuer.js';
import { UserRepository } from '../../domain/identity/user.repository.js';
import { InvalidCredentialsError } from './identity.errors.js';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.users.findByEmail(command.email);
    if (user === null) {
      throw new InvalidCredentialsError();
    }

    const matches = await this.hasher.verify(user.credentials.passwordHash, command.password);
    if (!matches) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokens.issue({
      sub: user.id,
      email: user.email,
      role: user.role.value,
    });
    return { accessToken };
  }
}
