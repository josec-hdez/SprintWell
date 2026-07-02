// Public (no-auth) read of a member's rules (issue #59, brief §10.1: a team
// member's preference rules are team info, not private).

import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ListRulesUseCase } from '../../../application/rules/list-rules.use-case.js';
import { type RuleView, toRuleView } from '../../../application/rules/views.js';
import { RuleResponseDto } from '../../dto/rules/rule-response.dto.js';

@ApiTags('public: rules')
@Controller('members/:ownerId/rules')
export class PublicRulesController {
  constructor(private readonly listRules: ListRulesUseCase) {}

  @Get()
  @ApiOkResponse({ type: [RuleResponseDto] })
  async list(@Param('ownerId') ownerId: string): Promise<RuleView[]> {
    const rules = await this.listRules.execute(ownerId);
    return rules.map(toRuleView);
  }
}
