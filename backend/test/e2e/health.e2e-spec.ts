import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';

/**
 * End-to-end smoke for `GET /health`.
 *
 * Boots the FULL `AppModule` (not a slimmed-down testing harness) so the
 * presentation → application → domain → infrastructure wiring is actually
 * exercised. Asserts only on the HTTP payload — deliberately avoids importing
 * `SystemHealth.ok()` to dodge a tautological re-assertion of the same
 * literal that the use case produces.
 */
describe('GET /health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with { status: "ok" }', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
