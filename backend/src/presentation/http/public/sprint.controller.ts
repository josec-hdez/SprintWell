// Public (no-auth) read endpoints for sprints (issue #53, brief §4.4).

import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { GetSprintUseCase } from '../../../application/sprint/get-sprint.use-case.js';
import { ListSprintsUseCase } from '../../../application/sprint/list-sprints.use-case.js';
import { type SprintView, toSprintView } from '../../../application/sprint/views.js';

@ApiTags('public: sprints')
@Controller('sprints')
export class SprintPublicController {
  constructor(
    private readonly listSprints: ListSprintsUseCase,
    private readonly getSprint: GetSprintUseCase,
  ) {}

  @Get()
  async list(): Promise<SprintView[]> {
    const sprints = await this.listSprints.execute();
    return sprints.map(toSprintView);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<SprintView> {
    return toSprintView(await this.getSprint.execute(id));
  }
}
