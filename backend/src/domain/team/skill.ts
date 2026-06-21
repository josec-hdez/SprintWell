// Pure-TypeScript Skill catalog entry (issue #48).
//
// §14.1: framework-agnostic. A Skill is an entity identified by ``id``; the
// non-empty invariants live here.

export class Skill {
  private constructor(
    public readonly id: string,
    public readonly name: string,
  ) {
    Object.freeze(this);
  }

  static create(id: string, name: string): Skill {
    if (id.trim().length === 0) {
      throw new Error('Skill requires a non-empty id.');
    }
    if (name.trim().length === 0) {
      throw new Error('Skill requires a non-empty name.');
    }
    return new Skill(id, name);
  }
}
