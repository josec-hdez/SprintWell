// Create a team member (admin) — issue #49.

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { Credentials } from '../../domain/identity/credentials.js';
import { PasswordHasher } from '../../domain/identity/password-hasher.js';
import { Role, type RoleValue } from '../../domain/identity/role.js';
import { User } from '../../domain/identity/user.js';
import { UserRepository } from '../../domain/identity/user.repository.js';
import { EmailAlreadyInUseError } from './team.errors.js';

export interface CreateMemberCommand {
  email: string;
  name: string;
  role: RoleValue;
  initialPassword: string;
}

@Injectable()
export class CreateMemberUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: CreateMemberCommand): Promise<User> {
    const existing = await this.users.findByEmail(command.email);
    if (existing !== null) {
      throw new EmailAlreadyInUseError(command.email);
    }
    const passwordHash = await this.hasher.hash(command.initialPassword);
    const user = User.create({
      id: randomUUID(),
      name: command.name,
      credentials: Credentials.create(command.email, passwordHash),
      role: Role.of(command.role),
    });
    await this.users.save(user);
    return user;
  }
}
