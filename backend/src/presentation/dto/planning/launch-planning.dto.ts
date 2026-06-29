// Request DTO for launching a planning run (issue #63).

import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const STRATEGIES = ['CPSAT', 'RANDOM', 'GREEDY'] as const;
const EQUITY_MODES = ['UTILITARIAN', 'MAX_MIN', 'NASH'] as const;

export class LaunchPlanningDto {
  @ApiProperty({ enum: STRATEGIES, example: 'CPSAT' })
  @IsIn(STRATEGIES)
  algorithm!: (typeof STRATEGIES)[number];

  @ApiProperty({ enum: EQUITY_MODES, example: 'UTILITARIAN' })
  @IsIn(EQUITY_MODES)
  equityMode!: (typeof EQUITY_MODES)[number];

  @ApiProperty({ required: false, minimum: 1, maximum: 300, example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  timeBudgetSeconds?: number;
}
