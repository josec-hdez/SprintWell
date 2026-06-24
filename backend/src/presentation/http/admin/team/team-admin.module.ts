// Presentation module for the admin Team endpoints (issue #50).
//
// Registers the controllers and the team use cases (application). The domain
// ports they depend on are bound by the @Global TeamInfrastructureModule, so
// this presentation module never imports infrastructure (§14.1). JwtModule is
// imported here for the AdminGuard's JwtService.

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AssignSkillUseCase } from '../../../../application/team/assign-skill.use-case.js';
import { CreateMemberUseCase } from '../../../../application/team/create-member.use-case.js';
import { CreateSkillUseCase } from '../../../../application/team/create-skill.use-case.js';
import { DeleteMemberUseCase } from '../../../../application/team/delete-member.use-case.js';
import { DeleteSkillUseCase } from '../../../../application/team/delete-skill.use-case.js';
import { ListMembersUseCase } from '../../../../application/team/list-members.use-case.js';
import { ListSkillsUseCase } from '../../../../application/team/list-skills.use-case.js';
import { AdminGuard } from '../../../guards/admin.guard.js';
import { MembersController } from './members.controller.js';
import { SkillsController } from './skills.controller.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';

@Module({
  imports: [JwtModule.register({ secret: JWT_SECRET })],
  controllers: [MembersController, SkillsController],
  providers: [
    CreateMemberUseCase,
    ListMembersUseCase,
    DeleteMemberUseCase,
    AssignSkillUseCase,
    CreateSkillUseCase,
    ListSkillsUseCase,
    DeleteSkillUseCase,
    AdminGuard,
  ],
})
export class TeamAdminModule {}
