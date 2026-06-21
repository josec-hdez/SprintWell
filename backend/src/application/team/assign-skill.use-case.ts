// Assign a skill + proficiency level to a member (admin) — issue #49.

import { Injectable } from '@nestjs/common';

import { UserRepository } from '../../domain/identity/user.repository.js';
import { MemberSkillRepository } from '../../domain/team/member-skill.repository.js';
import { SkillLevel } from '../../domain/team/skill-level.js';
import { TeamRepository } from '../../domain/team/team.repository.js';
import { MemberNotFoundError, SkillNotInCatalogError } from './team.errors.js';

export interface AssignSkillCommand {
  userId: string;
  skillId: string;
  level: number;
}

@Injectable()
export class AssignSkillUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly team: TeamRepository,
    private readonly memberSkills: MemberSkillRepository,
  ) {}

  async execute(command: AssignSkillCommand): Promise<void> {
    const member = await this.users.findById(command.userId);
    if (member === null) {
      throw new MemberNotFoundError(command.userId);
    }
    const catalog = await this.team.getCatalog();
    if (!catalog.hasSkill(command.skillId)) {
      throw new SkillNotInCatalogError(command.skillId);
    }
    // SkillLevel.of enforces the 1-5 invariant.
    await this.memberSkills.assign(command.userId, command.skillId, SkillLevel.of(command.level));
  }
}
