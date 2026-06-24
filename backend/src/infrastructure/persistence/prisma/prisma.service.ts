// PrismaClient wrapped as an injectable NestJS service (issue #44).
//
// §14.1: Prisma is an infrastructure concern and never leaks past this layer.
// This service is the single shared `PrismaClient` instance; concrete
// repositories depend on it and translate rows to domain entities via mappers
// before anything crosses the layer boundary. It binds the client to the Nest
// lifecycle so the connection opens on boot and closes on shutdown.

import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Connection is LAZY: PrismaClient connects on the first query, so we do NOT
// call `$connect()` on init. This lets DB-backed modules be wired into the
// composition root and booted in environments without a database (e.g. the
// DB-free e2e/CI runs) — only requests that actually query the DB need it.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
