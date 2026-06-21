// Remove a skill from the catalog (admin) — issue #49.

import { Injectable } from '@nestjs/common';

import { TeamRepository } from '../../domain/team/team.repository.js';
import { SkillNotInCatalogError } from './team.errors.js';

@Injectable()
export class DeleteSkillUseCase {
  constructor(private readonly team: TeamRepository) {}

  async execute(skillId: string): Promise<void> {
    const catalog = await this.team.getCatalog();
    if (!catalog.hasSkill(skillId)) {
      throw new SkillNotInCatalogError(skillId);
    }
    await this.team.save(catalog.withoutSkill(skillId));
  }
}
