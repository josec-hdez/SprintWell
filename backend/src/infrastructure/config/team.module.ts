// Infrastructure wiring for the Team context (issue #50).
//
// @Global so presentation feature modules can resolve these domain ports
// without importing infrastructure (§14.1). Binds the Team/Identity ports the
// team use cases depend on to their Prisma / argon2 adapters.

import { Global, Module } from '@nestjs/common';

import { PasswordHasher } from '../../domain/identity/password-hasher.js';
import { UserRepository } from '../../domain/identity/user.repository.js';
import { MemberSkillRepository } from '../../domain/team/member-skill.repository.js';
import { TeamRepository } from '../../domain/team/team.repository.js';
import { Argon2PasswordHasher } from '../auth/argon2-password-hasher.js';
import { PrismaModule } from '../persistence/prisma/prisma.module.js';
import { PrismaMemberSkillRepository } from '../persistence/repositories/prisma-member-skill.repository.js';
import { PrismaTeamRepository } from '../persistence/repositories/prisma-team.repository.js';
import { PrismaUserRepository } from '../persistence/repositories/prisma-user.repository.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: TeamRepository, useClass: PrismaTeamRepository },
    { provide: MemberSkillRepository, useClass: PrismaMemberSkillRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
  ],
  exports: [UserRepository, TeamRepository, MemberSkillRepository, PasswordHasher],
})
export class TeamInfrastructureModule {}
