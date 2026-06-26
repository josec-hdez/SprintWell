// Admin endpoints for managing ANY member's rules (issue #59, brief §4.4).

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DeleteRuleUseCase } from '../../../../application/rules/delete-rule.use-case.js';
import { UpsertRuleUseCase } from '../../../../application/rules/upsert-rule.use-case.js';
import { CurrentUser, type AuthenticatedUser } from '../../../decorators/current-user.decorator.js';
import { UpsertRuleDto } from '../../../dto/rules/upsert-rule.dto.js';
import { AdminGuard } from '../../../guards/admin.guard.js';

@ApiTags('admin: rules')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/members/:ownerId/rules')
export class AdminRulesController {
  constructor(
    private readonly upsertRule: UpsertRuleUseCase,
    private readonly deleteRule: DeleteRuleUseCase,
  ) {}

  @Put(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async upsert(
    @Param('ownerId') ownerId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpsertRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.upsertRule.execute({
      actor: { userId: user.userId, role: user.role },
      ownerId,
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
    @Param('ownerId') ownerId: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.deleteRule.execute({
      actor: { userId: user.userId, role: user.role },
      ownerId,
      ruleId,
    });
  }
}
