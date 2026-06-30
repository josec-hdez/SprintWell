// Presentation module for the public auth endpoints (issue #67). The
// LoginUseCase it injects is provided by the @Global AuthModule (infrastructure),
// so this presentation module never imports infrastructure (§14.1).

import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';

@Module({
  controllers: [AuthController],
})
export class AuthHttpModule {}
