// Global module exposing the shared PrismaService (issue #45).
//
// @Global so any feature module can inject PrismaService without re-importing.
// Inert until a module that imports it is itself wired into the composition
// root, so it does not affect DB-free unit/e2e runs.

import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
