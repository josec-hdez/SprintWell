// Pure-TypeScript domain value object for authorization roles (issue #43).
//
// §14.1: no imports from application/infrastructure/presentation, no NestJS or
// Prisma. The MEMBER/ADMIN distinction is the basis of authorization (brief
// §4.4); the validity invariant lives here, not in a controller.

/** The two authorization roles of brief §4.4. */
export type RoleValue = 'MEMBER' | 'ADMIN';

const VALID_ROLES: readonly RoleValue[] = ['MEMBER', 'ADMIN'];

/**
 * Immutable value object wrapping a valid authorization role.
 *
 * Construct via the factories ({@link Role.of}, {@link Role.member},
 * {@link Role.admin}); the private constructor guarantees no invalid `Role`
 * instance can exist.
 */
export class Role {
  private constructor(public readonly value: RoleValue) {
    Object.freeze(this);
  }

  /** Parse an arbitrary string, rejecting anything outside the role union. */
  static of(value: string): Role {
    if (!VALID_ROLES.includes(value as RoleValue)) {
      throw new Error(`Invalid role: "${value}". Expected one of ${VALID_ROLES.join(', ')}.`);
    }
    return new Role(value as RoleValue);
  }

  static member(): Role {
    return new Role('MEMBER');
  }

  static admin(): Role {
    return new Role('ADMIN');
  }

  isAdmin(): boolean {
    return this.value === 'ADMIN';
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }
}
