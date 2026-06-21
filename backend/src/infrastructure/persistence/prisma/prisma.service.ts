// PrismaClient wrapped as an injectable NestJS service (issue #44).
//
// §14.1: Prisma is an infrastructure concern and never leaks past this layer.
// This service is the single shared `PrismaClient` instance; concrete
// repositories depend on it and translate rows to domain entities via mappers
// before anything crosses the layer boundary. It binds the client to the Nest
// lifecycle so the connection opens on boot and closes on shutdown.

import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
