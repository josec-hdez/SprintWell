// Application-layer errors for the Team context (issue #49). Distinct types let
// presentation map to 404 / 409 without leaking domain detail.

export class EmailAlreadyInUseError extends Error {
  constructor(email: string) {
    super(`A member with email ${email} already exists.`);
    this.name = 'EmailAlreadyInUseError';
  }
}

export class MemberNotFoundError extends Error {
  constructor(userId: string) {
    super(`Member not found: ${userId}.`);
    this.name = 'MemberNotFoundError';
  }
}

export class SkillNotInCatalogError extends Error {
  constructor(skillId: string) {
    super(`Skill not in catalog: ${skillId}.`);
    this.name = 'SkillNotInCatalogError';
  }
}
