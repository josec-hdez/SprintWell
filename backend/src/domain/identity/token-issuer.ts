// Domain port for issuing authentication tokens (issue #45).
//
// §14.1: the domain knows it issues a signed token from a set of claims, not
// that the token is a JWT. The concrete signer (JWT via @nestjs/jwt) lives in
// infrastructure/auth/jwt-token-issuer.ts.

import type { RoleValue } from './role.js';

/** Claims embedded in an authentication token. */
export interface AuthClaims {
  /** Subject — the user id. */
  sub: string;
  email: string;
  role: RoleValue;
}

export abstract class TokenIssuer {
  /** Issue a signed token carrying ``claims``. */
  abstract issue(claims: AuthClaims): Promise<string>;
}
