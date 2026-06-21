// Pure-TypeScript value object for a skill proficiency level (issue #48).
//
// §14.1: framework-agnostic. The 1-5 bound (brief §5.2) is enforced here so it
// can never be violated by a controller or repository.

export class SkillLevel {
  static readonly MIN = 1;
  static readonly MAX = 5;

  private constructor(public readonly value: number) {
    Object.freeze(this);
  }

  /** Build a level, rejecting anything outside the integer range [1, 5]. */
  static of(value: number): SkillLevel {
    if (!Number.isInteger(value) || value < SkillLevel.MIN || value > SkillLevel.MAX) {
      throw new Error(
        `Skill level must be an integer in [${SkillLevel.MIN}, ${SkillLevel.MAX}], got ${value}.`,
      );
    }
    return new SkillLevel(value);
  }

  equals(other: SkillLevel): boolean {
    return this.value === other.value;
  }
}
