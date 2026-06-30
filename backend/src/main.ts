import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { buildOpenApiConfig } from './openapi.config.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // OpenAPI document served at /docs and consumed by the frontend's typed
  // client generator (brief §7.1.1).
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, buildOpenApiConfig()));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`SprintWell backend listening on http://localhost:${port}`);
}

void bootstrap();
