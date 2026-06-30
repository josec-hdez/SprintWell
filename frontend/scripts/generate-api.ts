import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

/**
 * Generates the frontend's typed API surface from the backend's OpenAPI spec
 * (issue #66). The spec is produced by the backend's `npm run openapi:export`
 * into `shared/openapi.json`; regenerating from it — rather than hand-writing
 * types — keeps the client in lockstep with the API.
 *
 * Run via `npm run generate:api`. CI re-runs it and fails on drift.
 */
const SPEC = new URL('../../shared/openapi.json', import.meta.url);
const OUTPUT = fileURLToPath(new URL('../src/api/generated/schema.d.ts', import.meta.url));

const HEADER = `/**
 * AUTO-GENERATED from shared/openapi.json by scripts/generate-api.ts.
 * Do not edit by hand — run \`npm run generate:api\` to refresh.
 */

`;

async function main(): Promise<void> {
  const ast = await openapiTS(SPEC);
  writeFileSync(OUTPUT, HEADER + astToString(ast), 'utf8');
  console.log(`Wrote typed API schema to ${OUTPUT}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
