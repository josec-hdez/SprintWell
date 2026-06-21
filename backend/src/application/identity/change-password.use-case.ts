// Change-password use case (issue #45).
//
// Verifies the current password, hashes the new one with the injected hasher
// (argon2 at the composition root), and persists the updated user. Rebuilds the
// aggregate through its factory so the domain invariants re-run.

import { Injectable } from '@nestjs/common';

import { Credentials } from '../../domain/identity/credentials.js';
import { PasswordHasher } from '../../domain/identity/password-hasher.js';
import { User } from '../../domain/identity/user.js';
import { UserRepository } from '../../domain/identity/user.repository.js';
import { InvalidCredentialsError, UserNotFoundError } from './identity.errors.js';

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const user = await this.users.findById(command.userId);
    if (user === null) {
      throw new UserNotFoundError(command.userId);
    }

    const matches = await this.hasher.verify(
      user.credentials.passwordHash,
      command.currentPassword,
    );
    if (!matches) {
      throw new InvalidCredentialsError('Current password is incorrect.');
    }

    const newHash = await this.hasher.hash(command.newPassword);
    const updated = User.create({
      id: user.id,
      name: user.name,
      credentials: Credentials.create(user.email, newHash),
      role: user.role,
    });
    await this.users.save(updated);
  }
}
