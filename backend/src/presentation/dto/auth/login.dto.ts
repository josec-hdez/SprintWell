// Request DTO for the login endpoint (issue #67).

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ type: String, format: 'email', example: 'admin@sprintwell.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, minLength: 1, example: 'correct horse battery staple' })
  @IsString()
  @MinLength(1)
  password!: string;
}
