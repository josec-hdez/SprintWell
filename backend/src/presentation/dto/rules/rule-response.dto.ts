// Response DTOs for the member rule reads (issue #77). Mirror RuleView and
// RuleConflict so the @nestjs/swagger plugin emits response schemas for the
// typed client. `params` stays an open object — its shape is per-type and
// governed by the shared JSON Schemas.

import { ApiProperty } from '@nestjs/swagger';

export class RuleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  params!: Record<string, unknown>;

  @ApiProperty()
  weight!: number;

  @ApiProperty()
  isHard!: boolean;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  schemaVersion!: number;
}

export class RuleConflictResponseDto {
  @ApiProperty({ type: [String] })
  ruleIds!: string[];

  @ApiProperty({ enum: ['skill', 'category', 'weekday'] })
  target!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  description!: string;
}
