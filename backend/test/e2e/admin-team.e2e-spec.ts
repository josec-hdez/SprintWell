// e2e for the admin Team controllers (issue #50). DB-free: the use cases are
// mocked, so this exercises the AdminGuard, DTO validation, error mapping and
// OpenAPI generation without a database.

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AssignSkillUseCase } from '../../src/application/team/assign-skill.use-case.js';
import { CreateMemberUseCase } from '../../src/application/team/create-member.use-case.js';
import { CreateSkillUseCase } from '../../src/application/team/create-skill.use-case.js';
import { DeleteMemberUseCase } from '../../src/application/team/delete-member.use-case.js';
import { DeleteSkillUseCase } from '../../src/application/team/delete-skill.use-case.js';
import { ListMembersUseCase } from '../../src/application/team/list-members.use-case.js';
import { ListSkillsUseCase } from '../../src/application/team/list-skills.use-case.js';
import { EmailAlreadyInUseError } from '../../src/application/team/team.errors.js';
import { Credentials } from '../../src/domain/identity/credentials.js';
import { Role } from '../../src/domain/identity/role.js';
import { User } from '../../src/domain/identity/user.js';
import { Skill } from '../../src/domain/team/skill.js';
import { ApplicationExceptionFilter } from '../../src/presentation/filters/application-exception.filter.js';
import { MembersController } from '../../src/presentation/http/admin/team/members.controller.js';
import { SkillsController } from '../../src/presentation/http/admin/team/skills.controller.js';
import { AdminGuard } from '../../src/presentation/guards/admin.guard.js';

const SECRET = 'e2e-admin-team-secret';

const createMember = jest.fn();
const listMembers = jest.fn();
const createSkill = jest.fn();

describe('Admin Team controllers (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET })],
      controllers: [MembersController, SkillsController],
      providers: [
        { provide: CreateMemberUseCase, useValue: { execute: createMember } },
        { provide: ListMembersUseCase, useValue: { execute: listMembers } },
        { provide: DeleteMemberUseCase, useValue: { execute: jest.fn() } },
        { provide: AssignSkillUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateSkillUseCase, useValue: { execute: createSkill } },
        { provide: ListSkillsUseCase, useValue: { execute: jest.fn().mockResolvedValue([]) } },
        { provide: DeleteSkillUseCase, useValue: { execute: jest.fn() } },
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
    createMember.mockReset();
    listMembers.mockReset();
    createSkill.mockReset();
  });

  const token = (role: 'MEMBER' | 'ADMIN'): string =>
    jwt.sign({ sub: 'u1', email: 'a@b.com', role });
  const validMember = {
    email: 'new@x.com',
    name: 'New',
    role: 'MEMBER',
    initialPassword: 'changeme1',
  };

  it('rejects without a token (401)', () =>
    request(app.getHttpServer()).post('/admin/members').send(validMember).expect(401));

  it('forbids a non-admin (403)', () =>
    request(app.getHttpServer())
      .post('/admin/members')
      .set('Authorization', `Bearer ${token('MEMBER')}`)
      .send(validMember)
      .expect(403));

  it('rejects an invalid body with 400 (class-validator)', () =>
    request(app.getHttpServer())
      .post('/admin/members')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ email: 'not-an-email', name: '', role: 'KING', initialPassword: 'x' })
      .expect(400));

  it('creates a member for an admin (201) and returns the view', async () => {
    createMember.mockResolvedValue(
      User.create({
        id: 'u9',
        name: 'New',
        credentials: Credentials.create('new@x.com', 'h'),
        role: Role.member(),
      }),
    );
    const response = await request(app.getHttpServer())
      .post('/admin/members')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send(validMember)
      .expect(201);
    expect(response.body).toEqual({ id: 'u9', email: 'new@x.com', name: 'New', role: 'MEMBER' });
  });

  it('maps EmailAlreadyInUseError to 409', async () => {
    createMember.mockRejectedValue(new EmailAlreadyInUseError('new@x.com'));
    await request(app.getHttpServer())
      .post('/admin/members')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send(validMember)
      .expect(409);
  });

  it('creates a skill for an admin (201)', async () => {
    createSkill.mockResolvedValue(Skill.create('sk1', 'Python'));
    const response = await request(app.getHttpServer())
      .post('/admin/skills')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ name: 'Python' })
      .expect(201);
    expect(response.body).toEqual({ id: 'sk1', name: 'Python' });
  });

  it('generates an OpenAPI document covering the admin endpoints', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').setVersion('1').build(),
    );
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining(['/admin/members', '/admin/skills']),
    );
  });
});
