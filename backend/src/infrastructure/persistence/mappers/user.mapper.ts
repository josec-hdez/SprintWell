// Domain ↔ Prisma mapper for the User aggregate (issue #44).
//
// §14.1: Prisma row types stop here. This mapper is the only place that knows
// both the persistence shape (`@prisma/client` `User`) and the domain shape
// (`domain/identity`). Repositories use it so no Prisma type crosses into
// application/presentation.

import type { Prisma, Role as PrismaRole, User as PrismaUser } from '@prisma/client';

import { Credentials } from '../../../domain/identity/credentials.js';
import { Role } from '../../../domain/identity/role.js';
import { User } from '../../../domain/identity/user.js';

export class UserMapper {
  /** Build a domain `User` from a persisted Prisma row. */
  static toDomain(row: PrismaUser): User {
    return User.create({
      id: row.id,
      name: row.name,
      credentials: Credentials.create(row.email, row.passwordHash),
      role: Role.of(row.role),
    });
  }

  /** Project a domain `User` to the Prisma create-input shape. */
  static toPersistence(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      name: user.name,
      email: user.credentials.email,
      passwordHash: user.credentials.passwordHash,
      role: user.role.value as PrismaRole,
    };
  }

  /** Project a domain `User` to the Prisma update-input shape (mutable fields). */
  static toUpdate(user: User): Prisma.UserUpdateInput {
    return {
      name: user.name,
      email: user.credentials.email,
      passwordHash: user.credentials.passwordHash,
      role: user.role.value as PrismaRole,
    };
  }
}
