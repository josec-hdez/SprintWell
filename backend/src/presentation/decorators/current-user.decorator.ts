// `@CurrentUser()` param decorator + the authenticated-user shape (issue #46).
//
// §14.1: presentation must not import domain, so the authenticated principal is
// described here with a presentation-local type, populated by the auth guards
// from the verified JWT claims.

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/** Authorization roles, mirrored from the JWT claims (kept local per §14.1). */
export type AuthRole = 'MEMBER' | 'ADMIN';

/** The principal attached to the request by {@link MemberGuard}/{@link AdminGuard}. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: AuthRole;
}

/** Inject the authenticated user; only valid on guard-protected routes. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (request.user === undefined) {
      throw new Error('@CurrentUser() used on a route without an auth guard.');
    }
    return request.user;
  },
);
