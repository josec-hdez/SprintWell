// e2e for the role guards (issue #46). DB-free: a throwaway protected
// controller is mounted with a JwtModule, and tokens are minted in-test.

import { Controller, Get, type INestApplication, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../src/presentation/decorators/current-user.decorator.js';
import { AdminGuard } from '../../src/presentation/guards/admin.guard.js';
import { MemberGuard } from '../../src/presentation/guards/member.guard.js';

const SECRET = 'e2e-test-secret';

@Controller('protected')
class ProtectedController {
  @Get('member')
  @UseGuards(MemberGuard)
  member(@CurrentUser() user: AuthenticatedUser): { userId: string } {
    return { userId: user.userId };
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  admin(): { ok: true } {
    return { ok: true };
  }
}

describe('Auth guards (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET })],
      controllers: [ProtectedController],
      providers: [MemberGuard, AdminGuard],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const tokenFor = (role: 'MEMBER' | 'ADMIN'): string =>
    jwt.sign({ sub: 'u1', email: 'a@b.com', role });

  it('rejects the member endpoint without a token (401)', () =>
    request(app.getHttpServer()).get('/protected/member').expect(401));

  it('rejects an invalid token (401)', () =>
    request(app.getHttpServer())
      .get('/protected/member')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401));

  it('allows a member with a valid token (200) and exposes the principal', async () => {
    const response = await request(app.getHttpServer())
      .get('/protected/member')
      .set('Authorization', `Bearer ${tokenFor('MEMBER')}`)
      .expect(200);
    expect(response.body).toEqual({ userId: 'u1' });
  });

  it('forbids the admin endpoint for a member token (403)', () =>
    request(app.getHttpServer())
      .get('/protected/admin')
      .set('Authorization', `Bearer ${tokenFor('MEMBER')}`)
      .expect(403));

  it('allows the admin endpoint for an admin token (200)', () =>
    request(app.getHttpServer())
      .get('/protected/admin')
      .set('Authorization', `Bearer ${tokenFor('ADMIN')}`)
      .expect(200));
});
