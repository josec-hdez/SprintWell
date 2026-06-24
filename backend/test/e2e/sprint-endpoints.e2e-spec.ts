// e2e for the public + admin sprint endpoints (issue #53). DB-free: use cases
// are mocked, exercising public access, AdminGuard, validation and error maps.

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AddTaskUseCase } from '../../src/application/sprint/add-task.use-case.js';
import { ChangeTaskStatusUseCase } from '../../src/application/sprint/change-task-status.use-case.js';
import { CreateSprintUseCase } from '../../src/application/sprint/create-sprint.use-case.js';
import { DeleteSprintUseCase } from '../../src/application/sprint/delete-sprint.use-case.js';
import { GetSprintUseCase } from '../../src/application/sprint/get-sprint.use-case.js';
import { ListSprintsUseCase } from '../../src/application/sprint/list-sprints.use-case.js';
import { RemoveTaskUseCase } from '../../src/application/sprint/remove-task.use-case.js';
import {
  InvalidTransitionError,
  SprintNotFoundError,
} from '../../src/application/sprint/sprint.errors.js';
import { Sprint } from '../../src/domain/sprint/sprint.js';
import { ApplicationExceptionFilter } from '../../src/presentation/filters/application-exception.filter.js';
import { AdminGuard } from '../../src/presentation/guards/admin.guard.js';
import { SprintAdminController } from '../../src/presentation/http/admin/sprint/sprint.controller.js';
import { SprintPublicController } from '../../src/presentation/http/public/sprint.controller.js';

const SECRET = 'e2e-sprint-secret';

const listSprints = jest.fn();
const getSprint = jest.fn();
const createSprint = jest.fn();
const changeStatus = jest.fn();

function sampleSprint(): Sprint {
  return Sprint.create({
    id: 's1',
    name: 'Sprint 1',
    startDate: new Date('2026-05-04'),
    durationDays: 10,
  });
}

describe('Sprint endpoints (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET })],
      controllers: [SprintPublicController, SprintAdminController],
      providers: [
        { provide: ListSprintsUseCase, useValue: { execute: listSprints } },
        { provide: GetSprintUseCase, useValue: { execute: getSprint } },
        { provide: CreateSprintUseCase, useValue: { execute: createSprint } },
        { provide: DeleteSprintUseCase, useValue: { execute: jest.fn() } },
        { provide: AddTaskUseCase, useValue: { execute: jest.fn() } },
        { provide: RemoveTaskUseCase, useValue: { execute: jest.fn() } },
        { provide: ChangeTaskStatusUseCase, useValue: { execute: changeStatus } },
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
    listSprints.mockReset();
    getSprint.mockReset();
    createSprint.mockReset();
    changeStatus.mockReset();
  });

  const adminToken = (): string => jwt.sign({ sub: 'u1', email: 'a@b.com', role: 'ADMIN' });
  const memberToken = (): string => jwt.sign({ sub: 'u2', email: 'm@b.com', role: 'MEMBER' });

  it('lists sprints publicly without a token (200)', async () => {
    listSprints.mockResolvedValue([sampleSprint()]);
    const response = await request(app.getHttpServer()).get('/sprints').expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe('s1');
  });

  it('reads one sprint publicly (200) and 404s an unknown one', async () => {
    getSprint.mockResolvedValue(sampleSprint());
    await request(app.getHttpServer()).get('/sprints/s1').expect(200);

    getSprint.mockRejectedValue(new SprintNotFoundError('ghost'));
    await request(app.getHttpServer()).get('/sprints/ghost').expect(404);
  });

  it('rejects sprint creation without a token (401) and for a member (403)', async () => {
    const body = { name: 'S', startDate: '2026-05-04', durationDays: 10 };
    await request(app.getHttpServer()).post('/admin/sprints').send(body).expect(401);
    await request(app.getHttpServer())
      .post('/admin/sprints')
      .set('Authorization', `Bearer ${memberToken()}`)
      .send(body)
      .expect(403);
  });

  it('creates a sprint for an admin (201) and rejects an invalid body (400)', async () => {
    createSprint.mockResolvedValue(sampleSprint());
    await request(app.getHttpServer())
      .post('/admin/sprints')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'S', startDate: '2026-05-04', durationDays: 10 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/admin/sprints')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: '', startDate: 'nope', durationDays: 0 })
      .expect(400);
  });

  it('maps an illegal status transition to 409', async () => {
    changeStatus.mockRejectedValue(new InvalidTransitionError('TODO', 'DONE'));
    await request(app.getHttpServer())
      .patch('/admin/sprints/s1/tasks/t1/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'DONE' })
      .expect(409);
  });
});
