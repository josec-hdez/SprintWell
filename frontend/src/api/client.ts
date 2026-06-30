import createClient from 'openapi-fetch';

import type { paths } from '@/api/generated/schema';
import { apiBaseUrl } from '@/lib/http';

/**
 * Typed API client (issue #66). `openapi-fetch` binds fetch to the generated
 * `paths`, so endpoint URLs, methods, params and (where the backend declares
 * them) request/response bodies are all checked at compile time. Generated from
 * the backend's OpenAPI spec — never hand-written.
 *
 * Usage: `const { data, error } = await api.GET('/health');`
 */
export const api = createClient<paths>({ baseUrl: apiBaseUrl });

export type { paths } from '@/api/generated/schema';
