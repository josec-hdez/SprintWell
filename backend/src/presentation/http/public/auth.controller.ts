// Public login endpoint (issue #67). Exposes the existing LoginUseCase (issue
// #45) over HTTP so the frontend auth store can exchange credentials for a JWT.
// InvalidCredentialsError maps to 401 via the ApplicationExceptionFilter.

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { LoginUseCase } from '../../../application/identity/login.use-case.js';
import { LoginDto } from '../../dto/auth/login.dto.js';
import { LoginResponseDto } from '../../dto/auth/login-response.dto.js';

@ApiTags('public: auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly login: LoginUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  async loginUser(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.login.execute({ email: dto.email, password: dto.password });
  }
}
