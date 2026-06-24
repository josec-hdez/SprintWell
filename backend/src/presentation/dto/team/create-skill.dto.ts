// Request DTO for adding a skill to the catalog (issue #50).

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'Python' })
  @IsString()
  @MinLength(1)
  name!: string;
}
