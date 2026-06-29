// e2e for the planning endpoints — admin launch + public read (issue #63).
// DB-free: use cases mocked.

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { GetPlanningRunUseCase } from '../../src/application/planning/get-planning-run.use-case.js';
import { LaunchPlanningUseCase } from '../../src/application/planning/launch-planning.use-case.js';
import { ListSprintRunsUseCase } from '../../src/application/planning/list-sprint-runs.use-case.js';
import {
  OptimizerUnavailableError,
  PlanningRunNotFoundError,
} from '../../src/application/planning/planning.errors.js';
import { HappinessScore } from '../../src/domain/planning/happiness-score.js';
import { PlanningRun } from '../../src/domain/planning/planning-run.js';
import { PlanningStrategy } from '../../src/domain/planning/planning-strategy.js';
import { Assignment } from '../../src/domain/sprint/assignment.js';
import { ApplicationExceptionFilter } from '../../src/presentation/filters/application-exception.filter.js';
import { AdminGuard } from '../../src/presentation/guards/admin.guard.js';
import { PlanningAdminController } from '../../src/presentation/http/admin/planning.controller.js';
import { PlanningPublicController } from '../../src/presentation/http/public/planning.controller.js';

const SECRET = 'e2e-planning-secret';
const launch = jest.fn();
const getRun = jest.fn();

function sampleRun(): PlanningRun {
  return PlanningRun.create({
    id: 'run-1',
    sprintId: 's1',
    strategy: PlanningStrategy.of('CPSAT'),
    equityMode: 'UTILITARIAN',
    status: 'OPTIMAL',
    objectiveValue: 9,
    assignments: [Assignment.create('t1', 'u1', 0)],
    perUserHappiness: [{ userId: 'u1', score: HappinessScore.of(0.9) }],
    createdAt: new Date('2026-05-04'),
  });
}

describe('Planning endpoints (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET })],
      controllers: [PlanningAdminController, PlanningPublicController],
      providers: [
        { provide: LaunchPlanningUseCase, useValue: { execute: launch } },
        { provide: GetPlanningRunUseCase, useValue: { execute: getRun } },
        { provide: ListSprintRunsUseCase, useValue: { execute: jest.fn().mockResolvedValue([]) } },
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
    launch.mockReset();
    getRun.mockReset();
  });

  const token = (role: 'MEMBER' | 'ADMIN'): string =>
    jwt.sign({ sub: 'u1', email: 'a@b.com', role });
  const body = { algorithm: 'CPSAT', equityMode: 'UTILITARIAN' };

  it('requires admin to launch (401 / 403)', async () => {
    await request(app.getHttpServer())
      .post('/admin/sprints/s1/planning-runs')
      .send(body)
      .expect(401);
    await request(app.getHttpServer())
      .post('/admin/sprints/s1/planning-runs')
      .set('Authorization', `Bearer ${token('MEMBER')}`)
      .send(body)
      .expect(403);
  });

  it('launches a run for an admin (201) and returns the view', async () => {
    launch.mockResolvedValue(sampleRun());
    const response = await request(app.getHttpServer())
      .post('/admin/sprints/s1/planning-runs')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send(body)
      .expect(201);
    expect(response.body).toMatchObject({ id: 'run-1', status: 'OPTIMAL', averageHappiness: 0.9 });
    expect(launch).toHaveBeenCalledWith(
      expect.objectContaining({ sprintId: 's1', strategy: 'CPSAT', equityMode: 'UTILITARIAN' }),
    );
  });

  it('rejects an invalid algorithm (400)', () =>
    request(app.getHttpServer())
      .post('/admin/sprints/s1/planning-runs')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ algorithm: 'GENETIC', equityMode: 'UTILITARIAN' })
      .expect(400));

  it('maps an optimizer outage to 503', async () => {
    launch.mockRejectedValue(new OptimizerUnavailableError('ECONNREFUSED'));
    await request(app.getHttpServer())
      .post('/admin/sprints/s1/planning-runs')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send(body)
      .expect(503);
  });

  it('reads a run publicly (200) and 404s an unknown one', async () => {
    getRun.mockResolvedValue(sampleRun());
    await request(app.getHttpServer()).get('/planning-runs/run-1').expect(200);

    getRun.mockRejectedValue(new PlanningRunNotFoundError('ghost'));
    await request(app.getHttpServer()).get('/planning-runs/ghost').expect(404);
  });

  it('lists a sprint runs publicly (200)', () =>
    request(app.getHttpServer()).get('/sprints/s1/planning-runs').expect(200));
});
