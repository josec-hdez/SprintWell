/**
 * Prisma seed — a single example admin so a fresh database is immediately
 * usable (issue #42).
 *
 * The password is hashed with **argon2** — the same verifier the LoginUseCase
 * uses (issue #45) — so the seeded admin can actually log in. `update` also sets
 * the hash, so re-running repairs an admin created by an older (scrypt) seed.
 * The seed is idempotent (upsert by email), so re-running never duplicates it.
 *
 * Run with: `npm run prisma:seed` (after `prisma migrate deploy`).
 */
import * as argon2 from 'argon2';

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@sprintwell.local';
const ADMIN_DEV_PASSWORD = 'changeme';

function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

async function main(): Promise<void> {
  const passwordHash = await hashPassword(ADMIN_DEV_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash },
    create: {
      email: ADMIN_EMAIL,
      name: 'Admin',
      passwordHash,
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
