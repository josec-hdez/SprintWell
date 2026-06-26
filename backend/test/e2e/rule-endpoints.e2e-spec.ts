// e2e for the rule endpoints — member, admin, public (issue #59). DB-free.

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { DeleteRuleUseCase } from '../../src/application/rules/delete-rule.use-case.js';
import { ListRulesUseCase } from '../../src/application/rules/list-rules.use-case.js';
import { RuleConflictError } from '../../src/application/rules/rules.errors.js';
import { UpsertRuleUseCase } from '../../src/application/rules/upsert-rule.use-case.js';
import { ValidateRuleSetUseCase } from '../../src/application/rules/validate-rule-set.use-case.js';
import { ApplicationExceptionFilter } from '../../src/presentation/filters/application-exception.filter.js';
import { AdminGuard } from '../../src/presentation/guards/admin.guard.js';
import { MemberGuard } from '../../src/presentation/guards/member.guard.js';
import { AdminRulesController } from '../../src/presentation/http/admin/rules/rules.controller.js';
import { MemberRulesController } from '../../src/presentation/http/member/rules/rules.controller.js';
import { PublicRulesController } from '../../src/presentation/http/public/rules.controller.js';

const SECRET = 'e2e-rules-secret';
const upsert = jest.fn();
const listRules = jest.fn();

describe('Rule endpoints (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET })],
      controllers: [MemberRulesController, AdminRulesController, PublicRulesController],
      providers: [
        { provide: UpsertRuleUseCase, useValue: { execute: upsert } },
        { provide: DeleteRuleUseCase, useValue: { execute: jest.fn() } },
        { provide: ListRulesUseCase, useValue: { execute: listRules } },
        { provide: ValidateRuleSetUseCase, useValue: { execute: jest.fn().mockResolvedValue([]) } },
        MemberGuard,
        AdminGuard,
        { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
        { provide: APP_FILTER, useClass: ApplicationExceptionFilter },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    upsert.mockReset();
    listRules.mockReset();
  });

  const token = (role: 'MEMBER' | 'ADMIN', sub = 'u1'): string =>
    jwt.sign({ sub, email: 'a@b.com', role });
  const body = {
    type: 'PREFER_CATEGORY',
    params: { category: 'feature' },
    weight: 30,
    isHard: false,
  };

  it('rejects a member rule upsert without a token (401)', () =>
    request(app.getHttpServer()).put('/me/rules/r1').send(body).expect(401));

  it('lets a member upsert their own rule (204) with self as owner', async () => {
    upsert.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .put('/me/rules/r1')
      .set('Authorization', `Bearer ${token('MEMBER')}`)
      .send(body)
      .expect(204);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'u1',
        ruleId: 'r1',
        actor: { userId: 'u1', role: 'MEMBER' },
      }),
    );
  });

  it('returns 409 with the conflict list when the set is inconsistent', async () => {
    upsert.mockRejectedValue(
      new RuleConflictError([
        { ruleIds: ['r1', 'r2'], target: 'category', value: 'sre', description: 'x' },
      ]),
    );
    const response = await request(app.getHttpServer())
      .put('/me/rules/r1')
      .set('Authorization', `Bearer ${token('MEMBER')}`)
      .send(body)
      .expect(409);
    expect(response.body.conflicts).toHaveLength(1);
  });

  it('rejects a member on the admin route (403) and allows an admin (204)', async () => {
    await request(app.getHttpServer())
      .put('/admin/members/u2/rules/r1')
      .set('Authorization', `Bearer ${token('MEMBER')}`)
      .send(body)
      .expect(403);

    upsert.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .put('/admin/members/u2/rules/r1')
      .set('Authorization', `Bearer ${token('ADMIN', 'admin')}`)
      .send(body)
      .expect(204);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'u2' }));
  });

  it('reads a member rules publicly without a token (200)', async () => {
    listRules.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/members/u1/rules').expect(200);
  });

  it('rejects an invalid rule body (400)', () =>
    request(app.getHttpServer())
      .put('/me/rules/r1')
      .set('Authorization', `Bearer ${token('MEMBER')}`)
      .send({ type: 'NOPE', params: {}, weight: 200, isHard: 'yes' })
      .expect(400));
});
