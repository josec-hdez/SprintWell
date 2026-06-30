// Response DTO for the login endpoint (issue #67). Documents the JWT shape so
// the frontend's generated client types the login call end to end.

import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ type: String, description: 'Signed JWT for the Authorization: Bearer header.' })
  accessToken!: string;
}
