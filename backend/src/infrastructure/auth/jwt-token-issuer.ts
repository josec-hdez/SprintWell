// JWT adapter for the TokenIssuer domain port (issue #45).
//
// Wraps NestJS `JwtService`. The domain stays unaware that the token is a JWT;
// only this adapter knows. Signing config (secret, expiry) is provided by the
// `JwtModule` registered in `auth.module.ts`.

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { AuthClaims } from '../../domain/identity/token-issuer.js';
import { TokenIssuer } from '../../domain/identity/token-issuer.js';

@Injectable()
export class JwtTokenIssuer extends TokenIssuer {
  constructor(private readonly jwt: JwtService) {
    super();
  }

  issue(claims: AuthClaims): Promise<string> {
    return this.jwt.signAsync({ sub: claims.sub, email: claims.email, role: claims.role });
  }
}
