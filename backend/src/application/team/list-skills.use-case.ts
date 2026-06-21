// List the skill catalog — issue #49.

import { Injectable } from '@nestjs/common';

import { Skill } from '../../domain/team/skill.js';
import { TeamRepository } from '../../domain/team/team.repository.js';

@Injectable()
export class ListSkillsUseCase {
  constructor(private readonly team: TeamRepository) {}

  async execute(): Promise<readonly Skill[]> {
    const catalog = await this.team.getCatalog();
    return catalog.skills;
  }
}
