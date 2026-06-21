// Pure-TypeScript `User` aggregate root for the Identity context (issue #43).
//
// §14.1: no framework imports. The aggregate composes the `Credentials` and
// `Role` value objects and owns the identity invariants (non-empty id/name);
// the VOs own their own (valid role, non-empty credentials), so an invalid
// `User` cannot be constructed.

import { Credentials } from './credentials.js';
import { Role } from './role.js';

export interface UserProps {
  id: string;
  name: string;
  credentials: Credentials;
  role: Role;
}

/**
 * Identity aggregate root. Immutable; build via {@link User.create}.
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly credentials: Credentials,
    public readonly role: Role,
  ) {
    Object.freeze(this);
  }

  static create(props: UserProps): User {
    if (props.id.trim().length === 0) {
      throw new Error('User requires a non-empty id.');
    }
    if (props.name.trim().length === 0) {
      throw new Error('User requires a non-empty name.');
    }
    return new User(props.id, props.name, props.credentials, props.role);
  }

  /** Convenience accessor — the email lives on the credentials VO. */
  get email(): string {
    return this.credentials.email;
  }

  isAdmin(): boolean {
    return this.role.isAdmin();
  }
}
