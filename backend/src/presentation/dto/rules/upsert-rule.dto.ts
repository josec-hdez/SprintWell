// Request DTO for creating/updating a rule (issue #59). Envelope validation;
// per-type `params` shape is governed by the shared JSON Schema (issue #56).

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

const RULE_TYPES = [
  'PREFER_SKILL',
  'AVOID_SKILL',
  'PREFER_CATEGORY',
  'AVOID_CATEGORY',
  'PREFER_DOMAIN',
  'PREFER_WEEKDAY',
  'AVOID_WEEKDAY',
  'BLACKOUT_DATE',
  'MAX_TASKS_PER_SPRINT',
  'FOCUS_PREFERENCE',
  'COOLDOWN_AFTER',
  'LEARN_SKILL',
] as const;

export class UpsertRuleDto {
  @ApiProperty({ enum: RULE_TYPES, example: 'PREFER_CATEGORY' })
  @IsIn(RULE_TYPES)
  type!: string;

  @ApiProperty({ type: 'object', additionalProperties: true, example: { category: 'feature' } })
  @IsObject()
  params!: Record<string, unknown>;

  @ApiProperty({ minimum: 0, maximum: 100, example: 30 })
  @IsInt()
  @Min(0)
  @Max(100)
  weight!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isHard!: boolean;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
