// Request DTO for creating a member (issue #50). class-validator enforces the
// shape at the HTTP boundary; @ApiProperty documents it in the OpenAPI schema.

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: ['MEMBER', 'ADMIN'], example: 'MEMBER' })
  @IsIn(['MEMBER', 'ADMIN'])
  role!: 'MEMBER' | 'ADMIN';

  @ApiProperty({ minLength: 8, example: 'changeme123' })
  @IsString()
  @MinLength(8)
  initialPassword!: string;
}
