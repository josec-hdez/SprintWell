// Request DTO for adding a task to a sprint (issue #53).

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

const CATEGORIES = ['FEATURE', 'BUG', 'INFRA', 'SRE', 'ON_CALL', 'DOCS', 'RESEARCH'] as const;

export class AddTaskDto {
  @ApiProperty({ example: 'Implement login' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  effortDays!: number;

  @ApiProperty({ enum: CATEGORIES, example: 'FEATURE' })
  @IsIn(CATEGORIES)
  category!: string;

  @ApiProperty({ example: 'auth' })
  @IsString()
  @MinLength(1)
  domain!: string;

  @ApiProperty({ required: false, minimum: 0, example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deadlineDay?: number;

  @ApiProperty({ required: false, type: [String], example: ['skill-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiProperty({ required: false, type: [String], example: ['task-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOn?: string[];
}
