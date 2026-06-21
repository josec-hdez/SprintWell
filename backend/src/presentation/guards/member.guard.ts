// MemberGuard — requires any authenticated user (valid JWT) (issue #46).

import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { authenticateRequest, type RequestWithUser } from './authenticate-request.js';

@Injectable()
export class MemberGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    await authenticateRequest(this.jwt, request);
    return true;
  }
}
