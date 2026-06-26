// Member endpoints for managing one's OWN rules (issue #59, brief §4.4).

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DeleteRuleUseCase } from '../../../../application/rules/delete-rule.use-case.js';
import { ListRulesUseCase } from '../../../../application/rules/list-rules.use-case.js';
import { UpsertRuleUseCase } from '../../../../application/rules/upsert-rule.use-case.js';
import { ValidateRuleSetUseCase } from '../../../../application/rules/validate-rule-set.use-case.js';
import {
  type RuleConflict,
  type RuleView,
  toRuleView,
} from '../../../../application/rules/views.js';
import { CurrentUser, type AuthenticatedUser } from '../../../decorators/current-user.decorator.js';
import { UpsertRuleDto } from '../../../dto/rules/upsert-rule.dto.js';
import { MemberGuard } from '../../../guards/member.guard.js';

@ApiTags('member: rules')
@ApiBearerAuth()
@UseGuards(MemberGuard)
@Controller('me/rules')
export class MemberRulesController {
  constructor(
    private readonly upsertRule: UpsertRuleUseCase,
    private readonly deleteRule: DeleteRuleUseCase,
    private readonly listRules: ListRulesUseCase,
    private readonly validateRuleSet: ValidateRuleSetUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<RuleView[]> {
    const rules = await this.listRules.execute(user.userId);
    return rules.map(toRuleView);
  }

  @Get('conflicts')
  conflicts(@CurrentUser() user: AuthenticatedUser): Promise<RuleConflict[]> {
    return this.validateRuleSet.execute(user.userId);
  }

  @Put(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async upsert(
    @Param('ruleId') ruleId: string,
    @Body() dto: UpsertRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.upsertRule.execute({
      actor: { userId: user.userId, role: user.role },
      ownerId: user.userId,
      ruleId,
      type: dto.type,
      params: dto.params,
      weight: dto.weight,
      isHard: dto.isHard,
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
    });
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.deleteRule.execute({
      actor: { userId: user.userId, role: user.role },
      ownerId: user.userId,
      ruleId,
    });
  }
}
