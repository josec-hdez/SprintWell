// Pure-TypeScript Team aggregate — the skill catalog (issue #48).
//
// §14.1: framework-agnostic. The aggregate owns the catalog invariant — skill
// ids are unique (brief §5.2). Immutable: mutating operations return a new
// `Team` rather than changing the instance.

import { Skill } from './skill.js';

export class Team {
  private constructor(public readonly skills: readonly Skill[]) {
    Object.freeze(this);
  }

  /** Build a catalog, rejecting duplicate skill ids. */
  static create(skills: readonly Skill[] = []): Team {
    const seen = new Set<string>();
    for (const skill of skills) {
      if (seen.has(skill.id)) {
        throw new Error(`Duplicate skill id in catalog: ${skill.id}.`);
      }
      seen.add(skill.id);
    }
    return new Team(Object.freeze([...skills]));
  }

  hasSkill(skillId: string): boolean {
    return this.skills.some((skill) => skill.id === skillId);
  }

  /** Return a new catalog with ``skill`` added; rejects a duplicate id. */
  withSkill(skill: Skill): Team {
    if (this.hasSkill(skill.id)) {
      throw new Error(`Skill id already in catalog: ${skill.id}.`);
    }
    return Team.create([...this.skills, skill]);
  }
}
