// Admin REST controller for the skill catalog (issue #50).

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

import { CreateSkillUseCase } from '../../../../application/team/create-skill.use-case.js';
import { DeleteSkillUseCase } from '../../../../application/team/delete-skill.use-case.js';
import { ListSkillsUseCase } from '../../../../application/team/list-skills.use-case.js';
import { type SkillView, toSkillView } from '../../../../application/team/views.js';
import { CreateSkillDto } from '../../../dto/team/create-skill.dto.js';
import { SkillResponseDto } from '../../../dto/team/team-response.dto.js';
import { AdminGuard } from '../../../guards/admin.guard.js';

@ApiTags('admin: skills')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/skills')
export class SkillsController {
  constructor(
    private readonly createSkill: CreateSkillUseCase,
    private readonly listSkills: ListSkillsUseCase,
    private readonly deleteSkill: DeleteSkillUseCase,
  ) {}

  @Post()
  @ApiOkResponse({ type: SkillResponseDto })
  async create(@Body() dto: CreateSkillDto): Promise<SkillView> {
    return toSkillView(await this.createSkill.execute(dto.name));
  }

  @Get()
  @ApiOkResponse({ type: [SkillResponseDto] })
  async list(): Promise<SkillView[]> {
    const skills = await this.listSkills.execute();
    return skills.map(toSkillView);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteSkill.execute(id);
  }
}
