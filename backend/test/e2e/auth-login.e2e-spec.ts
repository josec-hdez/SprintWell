// e2e for the public login endpoint (issue #67). DB-free: LoginUseCase is
// mocked, so this exercises DTO validation, the success shape and the
// InvalidCredentialsError → 401 mapping without a database.

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { LoginUseCase } from '../../src/application/identity/login.use-case.js';
import { InvalidCredentialsError } from '../../src/application/identity/identity.errors.js';
import { ApplicationExceptionFilter } from '../../src/presentation/filters/application-exception.filter.js';
import { AuthController } from '../../src/presentation/http/public/auth.controller.js';

const execute = jest.fn();

describe('Auth login (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: { execute } },
        { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
        { provide: APP_FILTER, useClass: ApplicationExceptionFilter },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execute.mockReset();
  });

  const credentials = { email: 'admin@sprintwell.dev', password: 'correct-password' };

  it('returns 200 with the access token on valid credentials', async () => {
    execute.mockResolvedValue({ accessToken: 'signed.jwt.token' });

    const response = await request(app.getHttpServer()).post('/auth/login').send(credentials);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ accessToken: 'signed.jwt.token' });
    expect(execute).toHaveBeenCalledWith(credentials);
  });

  it('maps InvalidCredentialsError to 401', async () => {
    execute.mockRejectedValue(new InvalidCredentialsError());

    const response = await request(app.getHttpServer()).post('/auth/login').send(credentials);

    expect(response.status).toBe(401);
  });

  it('rejects a malformed email with 400 and does not call the use case', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'x' });

    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('strips unknown fields via the whitelist pipe', async () => {
    execute.mockResolvedValue({ accessToken: 't' });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, role: 'ADMIN' });

    expect(execute).toHaveBeenCalledWith(credentials);
  });
});
