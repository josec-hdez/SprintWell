// Presentation module for rule endpoints — member, admin and public (issue #59).

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { DeleteRuleUseCase } from '../../application/rules/delete-rule.use-case.js';
import { ListRulesUseCase } from '../../application/rules/list-rules.use-case.js';
import { UpsertRuleUseCase } from '../../application/rules/upsert-rule.use-case.js';
import { ValidateRuleSetUseCase } from '../../application/rules/validate-rule-set.use-case.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { MemberGuard } from '../guards/member.guard.js';
import { AdminRulesController } from './admin/rules/rules.controller.js';
import { MemberRulesController } from './member/rules/rules.controller.js';
import { PublicRulesController } from './public/rules.controller.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';

@Module({
  imports: [JwtModule.register({ secret: JWT_SECRET })],
  controllers: [MemberRulesController, AdminRulesController, PublicRulesController],
  providers: [
    UpsertRuleUseCase,
    DeleteRuleUseCase,
    ListRulesUseCase,
    ValidateRuleSetUseCase,
    MemberGuard,
    AdminGuard,
  ],
})
export class RulesHttpModule {}
