// Shared bearer-token authentication for the auth guards (issue #46).
//
// Extracts and verifies the JWT, then attaches the decoded principal to the
// request. A missing or invalid token is a 401 (UnauthorizedException); role
// checks (403) are layered on top by AdminGuard.

import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';

import type { AuthenticatedUser, AuthRole } from '../decorators/current-user.decorator.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: AuthRole;
}

/** Express-ish request shape the guards read/populate. */
export interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}

function extractBearer(request: RequestWithUser): string | null {
  const header = request.headers['authorization'];
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return null;
}

/** Verify the bearer token, attach the principal to the request, and return it. */
export async function authenticateRequest(
  jwt: JwtService,
  request: RequestWithUser,
): Promise<AuthenticatedUser> {
  const token = extractBearer(request);
  if (token === null) {
    throw new UnauthorizedException('Missing bearer token.');
  }

  let payload: JwtPayload;
  try {
    payload = await jwt.verifyAsync<JwtPayload>(token);
  } catch {
    throw new UnauthorizedException('Invalid or expired token.');
  }

  const user: AuthenticatedUser = {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  request.user = user;
  return user;
}
