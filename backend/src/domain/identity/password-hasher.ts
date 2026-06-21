// Domain port for password hashing/verification (issue #45).
//
// §14.1: the domain only knows the CONTRACT — "hash a plaintext, verify a
// plaintext against a hash". The concrete algorithm (argon2) is an
// infrastructure detail (infrastructure/auth/argon2-password-hasher.ts). Use
// cases depend on this abstract class, never on argon2.

export abstract class PasswordHasher {
  /** Hash a plaintext password into a storable digest. */
  abstract hash(plainPassword: string): Promise<string>;

  /** Whether ``plainPassword`` matches the previously produced ``hash``. */
  abstract verify(hash: string, plainPassword: string): Promise<boolean>;
}
