// Request DTO for changing a task status (issue #53 / #54).

import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;

export class ChangeTaskStatusDto {
  @ApiProperty({ enum: STATUSES, example: 'IN_PROGRESS' })
  @IsIn(STATUSES)
  status!: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
}
