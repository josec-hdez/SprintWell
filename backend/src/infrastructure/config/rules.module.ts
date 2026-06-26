// Infrastructure wiring for the Rules context (issue #59). @Global so the rules
// presentation module resolves the port without importing infrastructure.

import { Global, Module } from '@nestjs/common';

import { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';
import { PrismaModule } from '../persistence/prisma/prisma.module.js';
import { PrismaRuleSetRepository } from '../persistence/repositories/prisma-rule-set.repository.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [{ provide: RuleSetRepository, useClass: PrismaRuleSetRepository }],
  exports: [RuleSetRepository],
})
export class RulesInfrastructureModule {}
