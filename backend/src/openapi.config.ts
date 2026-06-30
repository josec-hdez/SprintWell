import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * Single source of truth for the OpenAPI document (issue #66). Shared by the
 * runtime (`main.ts`, which serves it at `/docs`) and the export script
 * (`openapi-export.ts`, which dumps it to `shared/openapi.json` for the
 * frontend's typed client generator). Keeping one builder avoids drift between
 * the served spec and the generated client.
 */
export function buildOpenApiConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('SprintWell API')
    .setDescription('Sprint planning backend — admin, member and public endpoints.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, buildOpenApiConfig());
}
