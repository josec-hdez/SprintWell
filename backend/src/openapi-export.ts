import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { createOpenApiDocument } from './openapi.config.js';

/**
 * Dumps the OpenAPI document to `shared/openapi.json` (issue #66) so the
 * frontend can generate its typed client from it. The app is created but never
 * listens, and `PrismaService` connects lazily, so this runs without a database.
 *
 * Runs from the compiled output (`nest build && node dist/openapi-export.js`)
 * rather than via ts-node/tsx: the @nestjs/swagger compiler plugin only applies
 * through `nest build`, and it is what auto-derives request/response schemas
 * from the DTO classes. CI re-runs the script and fails on drift.
 */
async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = createOpenApiDocument(app);
  await app.close();

  const target = join(__dirname, '../../shared/openapi.json');
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log(`Wrote OpenAPI spec to ${target}`);
}

void main();
