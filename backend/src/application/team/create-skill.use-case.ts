// Add a skill to the catalog (admin) — issue #49.

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { Skill } from '../../domain/team/skill.js';
import { TeamRepository } from '../../domain/team/team.repository.js';

@Injectable()
export class CreateSkillUseCase {
  constructor(private readonly team: TeamRepository) {}

  async execute(name: string): Promise<Skill> {
    const skill = Skill.create(randomUUID(), name);
    const catalog = await this.team.getCatalog();
    await this.team.save(catalog.withSkill(skill));
    return skill;
  }
}
