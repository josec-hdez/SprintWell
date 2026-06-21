// AdminGuard — requires an authenticated user with the ADMIN role (issue #46).

import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { authenticateRequest, type RequestWithUser } from './authenticate-request.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = await authenticateRequest(this.jwt, request);
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin role required.');
    }
    return true;
  }
}
