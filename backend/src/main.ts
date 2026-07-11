import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { buildOpenApiConfig } from './openapi.config.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Allow the SPA (a different origin in dev, e.g. http://localhost:5173) to
  // call the API. Auth uses a Bearer header, not cookies, so credentials are
  // not required. `FRONTEND_URL` narrows the allowed origin in production.
  app.enableCors({ origin: process.env.FRONTEND_URL ?? true });

  // OpenAPI document served at /docs and consumed by the frontend's typed
  // client generator (brief §7.1.1).
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, buildOpenApiConfig()));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`SprintWell backend listening on http://localhost:${port}`);
}

void bootstrap();
