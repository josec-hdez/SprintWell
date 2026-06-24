// Application-layer read views for the Team context (issue #50).
//
// Presentation cannot import domain (§14.1), so use-case results are projected
// into these plain shapes here (application → domain is allowed) and the HTTP
// controllers map from them.

import type { User } from '../../domain/identity/user.js';
import type { Skill } from '../../domain/team/skill.js';

export interface MemberView {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface SkillView {
  id: string;
  name: string;
}

export function toMemberView(user: User): MemberView {
  return { id: user.id, email: user.email, name: user.name, role: user.role.value };
}

export function toSkillView(skill: Skill): SkillView {
  return { id: skill.id, name: skill.name };
}
