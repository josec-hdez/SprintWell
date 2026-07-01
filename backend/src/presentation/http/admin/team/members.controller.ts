// Admin REST controller for member management (issue #50).

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AssignSkillUseCase } from '../../../../application/team/assign-skill.use-case.js';
import { CreateMemberUseCase } from '../../../../application/team/create-member.use-case.js';
import { DeleteMemberUseCase } from '../../../../application/team/delete-member.use-case.js';
import { ListMembersUseCase } from '../../../../application/team/list-members.use-case.js';
import { type MemberView, toMemberView } from '../../../../application/team/views.js';
import { AssignSkillDto } from '../../../dto/team/assign-skill.dto.js';
import { CreateMemberDto } from '../../../dto/team/create-member.dto.js';
import { MemberResponseDto } from '../../../dto/team/team-response.dto.js';
import { AdminGuard } from '../../../guards/admin.guard.js';

@ApiTags('admin: members')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/members')
export class MembersController {
  constructor(
    private readonly createMember: CreateMemberUseCase,
    private readonly listMembers: ListMembersUseCase,
    private readonly deleteMember: DeleteMemberUseCase,
    private readonly assignSkill: AssignSkillUseCase,
  ) {}

  @Post()
  @ApiOkResponse({ type: MemberResponseDto })
  async create(@Body() dto: CreateMemberDto): Promise<MemberView> {
    const user = await this.createMember.execute({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      initialPassword: dto.initialPassword,
    });
    return toMemberView(user);
  }

  @Get()
  @ApiOkResponse({ type: [MemberResponseDto] })
  async list(): Promise<MemberView[]> {
    const users = await this.listMembers.execute();
    return users.map(toMemberView);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteMember.execute(id);
  }

  @Post(':id/skills')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assign(@Param('id') id: string, @Body() dto: AssignSkillDto): Promise<void> {
    await this.assignSkill.execute({ userId: id, skillId: dto.skillId, level: dto.level });
  }
}
