// Application-layer errors for the Identity context (issue #45).
//
// Distinct error types let the presentation layer map them to HTTP status
// codes (401 / 404) without leaking domain/infrastructure detail.

/** Raised when an email/password pair (or a current-password check) is wrong. */
export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid credentials.') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

/** Raised when a referenced user does not exist. */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}.`);
    this.name = 'UserNotFoundError';
  }
}
