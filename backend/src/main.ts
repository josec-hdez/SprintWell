import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // OpenAPI document served at /docs and consumed by the frontend's typed
  // client generator (brief §7.1.1).
  const openApiConfig = new DocumentBuilder()
    .setTitle('SprintWell API')
    .setDescription('Sprint planning backend — admin, member and public endpoints.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, openApiConfig));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`SprintWell backend listening on http://localhost:${port}`);
}

void bootstrap();
