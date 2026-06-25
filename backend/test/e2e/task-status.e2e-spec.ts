// e2e for the member task-status endpoint (issue #54). DB-free: the use case is
// mocked, so this checks MemberGuard, validation and the ownership → 403 map.

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ChangeOwnTaskStatusUseCase } from '../../src/application/sprint/change-own-task-status.use-case.js';
import { TaskOwnershipError } from '../../src/application/sprint/sprint.errors.js';
import { ApplicationExceptionFilter } from '../../src/presentation/filters/application-exception.filter.js';
import { MemberGuard } from '../../src/presentation/guards/member.guard.js';
import { TaskStatusController } from '../../src/presentation/http/member/task-status.controller.js';

const SECRET = 'e2e-task-status-secret';
const changeOwn = jest.fn();

describe('Member task-status endpoint (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET })],
      controllers: [TaskStatusController],
      providers: [
        { provide: ChangeOwnTaskStatusUseCase, useValue: { execute: changeOwn } },
        MemberGuard,
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

  beforeEach(() => changeOwn.mockReset());

  const token = (): string => jwt.sign({ sub: 'u1', email: 'a@b.com', role: 'MEMBER' });

  it('rejects without a token (401)', () =>
    request(app.getHttpServer())
      .patch('/tasks/t1/status')
      .send({ status: 'IN_PROGRESS' })
      .expect(401));

  it('changes the status of an owned task (204) and forwards the caller id', async () => {
    changeOwn.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .patch('/tasks/t1/status')
      .set('Authorization', `Bearer ${token()}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(204);
    expect(changeOwn).toHaveBeenCalledWith({ taskId: 't1', userId: 'u1', status: 'IN_PROGRESS' });
  });

  it('returns 403 when the member does not own the task', async () => {
    changeOwn.mockRejectedValue(new TaskOwnershipError('t1'));
    await request(app.getHttpServer())
      .patch('/tasks/t1/status')
      .set('Authorization', `Bearer ${token()}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(403);
  });

  it('rejects an invalid status value (400)', () =>
    request(app.getHttpServer())
      .patch('/tasks/t1/status')
      .set('Authorization', `Bearer ${token()}`)
      .send({ status: 'WAT' })
      .expect(400));
});
