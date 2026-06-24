// Request DTO for assigning a skill + level to a member (issue #50).

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class AssignSkillDto {
  @ApiProperty({ example: 'skill-uuid' })
  @IsString()
  @MinLength(1)
  skillId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  level!: number;
}
