// Domain port for User persistence (issue #43).
//
// Declared as an `abstract class` (not an interface) following the repository
// convention of `domain/shared/system-health.ts`: it doubles as the TypeScript
// contract AND the NestJS DI token, while keeping `domain/` free of decorators.
// Concrete adapters live in `infrastructure/` (issue #44, PrismaUserRepository).

import { User } from './user.js';

export abstract class UserRepository {
  /** Return the user with this id, or `null` if none exists. */
  abstract findById(id: string): Promise<User | null>;

  /** Return the user with this email (case-insensitive), or `null`. */
  abstract findByEmail(email: string): Promise<User | null>;

  /** Return every user (admin member listing). */
  abstract findAll(): Promise<User[]>;

  /** Insert or update the user (upsert by id). */
  abstract save(user: User): Promise<void>;

  /** Remove the user with this id (no-op if absent). */
  abstract delete(id: string): Promise<void>;
}
