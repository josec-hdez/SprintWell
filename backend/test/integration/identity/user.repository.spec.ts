// Integration test for PrismaUserRepository against a REAL Postgres (issue #44).
//
// Excluded from the default `npm test` / CI (no DB); run with
// `npm run test:integration` after starting docker compose + migrating.

import { Credentials } from '@domain/identity/credentials.js';
import { Role } from '@domain/identity/role.js';
import { User } from '@domain/identity/user.js';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service.js';
import { PrismaUserRepository } from '@infrastructure/persistence/repositories/prisma-user.repository.js';

describe('PrismaUserRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaUserRepository(prisma);
  const createdIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.$disconnect();
  });

  function makeUser(id: string, role: Role, passwordHash = 'hash'): User {
    createdIds.push(id);
    return User.create({
      id,
      name: `User ${id}`,
      credentials: Credentials.create(`${id}@example.com`, passwordHash),
      role,
    });
  }

  it('saves a user and finds it by id (Prisma never crosses the boundary)', async () => {
    const id = `it-find-${Date.now()}`;
    await repository.save(makeUser(id, Role.admin()));

    const found = await repository.findById(id);
    expect(found).toBeInstanceOf(User);
    expect(found?.email).toBe(`${id}@example.com`);
    expect(found?.isAdmin()).toBe(true);
  });

  it('finds a user by email case-insensitively', async () => {
    const id = `it-email-${Date.now()}`;
    await repository.save(makeUser(id, Role.member()));

    const found = await repository.findByEmail(`${id}@EXAMPLE.com`);
    expect(found?.id).toBe(id);
  });

  it('upserts on save — a second save updates the existing row', async () => {
    const id = `it-upsert-${Date.now()}`;
    await repository.save(makeUser(id, Role.member(), 'hash-1'));
    await repository.save(
      User.create({
        id,
        name: 'Renamed',
        credentials: Credentials.create(`${id}@example.com`, 'hash-2'),
        role: Role.admin(),
      }),
    );

    const found = await repository.findById(id);
    expect(found?.name).toBe('Renamed');
    expect(found?.isAdmin()).toBe(true);
  });

  it('returns null for an unknown id', async () => {
    expect(await repository.findById('does-not-exist')).toBeNull();
  });
});
