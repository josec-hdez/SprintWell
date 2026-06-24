// Request DTO for creating a sprint (issue #53).

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 12' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: '2026-05-04', description: 'ISO date (YYYY-MM-DD).' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ minimum: 1, example: 10 })
  @IsInt()
  @Min(1)
  durationDays!: number;
}
