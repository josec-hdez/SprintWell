// Domain port for member↔skill proficiency assignments (issue #49).
//
// The User aggregate (Identity) and the Skill catalog (Team) are separate
// aggregates; their many-to-many link with a level lives in its own port so
// neither aggregate has to own the other. Concrete adapter (user_skills table)
// lands with the team REST wiring (issue #50).

import { SkillLevel } from './skill-level.js';

export abstract class MemberSkillRepository {
  /** Assign (or update) a member's proficiency in a skill. */
  abstract assign(userId: string, skillId: string, level: SkillLevel): Promise<void>;

  /** Remove a member's proficiency in a skill (no-op if absent). */
  abstract remove(userId: string, skillId: string): Promise<void>;
}
