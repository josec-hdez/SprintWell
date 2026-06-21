// Pure-TypeScript domain value object for user credentials (issue #43).
//
// §14.1: framework-agnostic. Credentials hold the EMAIL and the already-hashed
// password — the domain never sees or computes a plaintext password; hashing
// (argon2) is an infrastructure concern standardised in issue #45. The
// non-empty invariants ("no empty password / email") live here.

/**
 * Immutable value object pairing a normalized email with a password hash.
 *
 * The email is lower-cased and trimmed so equality/lookup is case-insensitive.
 */
export class Credentials {
  private constructor(
    public readonly email: string,
    public readonly passwordHash: string,
  ) {
    Object.freeze(this);
  }

  /** Build validated credentials, normalizing the email. */
  static create(email: string, passwordHash: string): Credentials {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length === 0) {
      throw new Error('Credentials require a non-empty email.');
    }
    if (!normalizedEmail.includes('@')) {
      throw new Error(`Credentials require a valid email, got "${email}".`);
    }
    if (passwordHash.trim().length === 0) {
      throw new Error('Credentials require a non-empty password hash.');
    }
    return new Credentials(normalizedEmail, passwordHash);
  }

  equals(other: Credentials): boolean {
    return this.email === other.email && this.passwordHash === other.passwordHash;
  }
}
