/**
 * Prisma seed — a single example admin so a fresh database is immediately
 * usable (issue #42).
 *
 * The password is hashed with Node's built-in scrypt to avoid pulling a native
 * dependency before the auth context lands. Issue #45 standardises credential
 * hashing on argon2; until then this dev admin can be reset there. The seed is
 * idempotent (upsert by email), so re-running never duplicates the admin.
 *
 * Run with: `npm run prisma:seed` (after `prisma migrate dev`).
 */
import { randomBytes, scryptSync } from 'node:crypto';

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@sprintwell.local';
const ADMIN_DEV_PASSWORD = 'changeme';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

async function main(): Promise<void> {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: 'Admin',
      passwordHash: hashPassword(ADMIN_DEV_PASSWORD),
      role: Role.ADMIN,
    },
  });
  console.log(`Seeded admin user: ${admin.email} (role ${admin.role})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
