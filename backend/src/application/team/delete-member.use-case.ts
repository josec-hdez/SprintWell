// Delete a team member (admin) — issue #49.

import { Injectable } from '@nestjs/common';

import { UserRepository } from '../../domain/identity/user.repository.js';
import { MemberNotFoundError } from './team.errors.js';

@Injectable()
export class DeleteMemberUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<void> {
    const existing = await this.users.findById(userId);
    if (existing === null) {
      throw new MemberNotFoundError(userId);
    }
    await this.users.delete(userId);
  }
}
