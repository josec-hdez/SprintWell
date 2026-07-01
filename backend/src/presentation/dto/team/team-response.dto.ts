// Response DTOs for the admin team reads (issue #73). Mirror the application
// MemberView/SkillView shapes so the @nestjs/swagger plugin emits response
// schemas that type the frontend's generated client. Controllers keep returning
// the views — the shapes are structurally identical.

import { ApiProperty } from '@nestjs/swagger';

export class MemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;
}

export class SkillResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}
