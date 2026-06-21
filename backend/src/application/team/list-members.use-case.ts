// List all team members (admin) — issue #49.

import { Injectable } from '@nestjs/common';

import { User } from '../../domain/identity/user.js';
import { UserRepository } from '../../domain/identity/user.repository.js';

@Injectable()
export class ListMembersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(): Promise<User[]> {
    return this.users.findAll();
  }
}
