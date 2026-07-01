// e2e for the member "my tasks" endpoint (issue #75). DB-free: the use case is
// mocked, so this exercises the MemberGuard and the response shape.

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ListMyTasksUseCase } from '../../src/application/sprint/list-my-tasks.use-case.js';
import { ApplicationExceptionFilter } from '../../src/presentation/filters/application-exception.filter.js';
import { MyTasksController } from '../../src/presentation/http/member/my-tasks.controller.js';
import { MemberGuard } from '../../src/presentation/guards/member.guard.js';

const SECRET = 'e2e-my-tasks-secret';
const execute = jest.fn();

describe('My tasks (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET })],
      controllers: [MyTasksController],
      providers: [
        { provide: ListMyTasksUseCase, useValue: { execute } },
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

  beforeEach(() => {
    execute.mockReset();
  });

  const token = (): string => jwt.sign({ sub: 'u1', email: 'm@x.com', role: 'MEMBER' });

  it('rejects requests without a token (401)', async () => {
    const response = await request(app.getHttpServer()).get('/me/tasks');
    expect(response.status).toBe(401);
  });

  it('returns the member tasks for the authenticated user', async () => {
    const rows = [
      {
        sprintId: 's1',
        sprintName: 'Apollo',
        taskId: 't1',
        taskName: 'OAuth',
        category: 'feature',
        effortDays: 3,
        startDay: 0,
        status: 'TODO',
      },
    ];
    execute.mockResolvedValue(rows);

    const response = await request(app.getHttpServer())
      .get('/me/tasks')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(rows);
    expect(execute).toHaveBeenCalledWith('u1');
  });
});
