import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { createOpenApiDocument } from './openapi.config.js';

/**
 * Dumps the OpenAPI document to `shared/openapi.json` (issue #66) so the
 * frontend can generate its typed client from it. The app is created but never
 * listens, and `PrismaService` connects lazily, so this runs without a database.
 *
 * Run via `npm run openapi:export`. CI re-runs it and fails on drift, keeping
 * the committed spec in lockstep with the controllers.
 */
async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = createOpenApiDocument(app);
  await app.close();

  const target = fileURLToPath(new URL('../../shared/openapi.json', import.meta.url));
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log(`Wrote OpenAPI spec to ${target}`);
}

void main();
