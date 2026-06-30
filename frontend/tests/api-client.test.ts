import { describe, it, expect, vi } from 'vitest';

import { api } from '@/api/client';

/**
 * Issue #66 acceptance: a call through the generated typed client compiles
 * (the path/method below only typecheck because they exist in the generated
 * `paths`) and works at runtime. A per-request `fetch` mock keeps the test
 * hermetic without hitting a real backend.
 */
function jsonFetch(body: unknown): typeof fetch {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  ) as unknown as typeof fetch;
}

describe('typed api client', () => {
  it('issues a typed GET to a known path and returns data', async () => {
    const mockFetch = jsonFetch({ status: 'ok' });

    const { data, error } = await api.GET('/health', { fetch: mockFetch });

    expect(error).toBeUndefined();
    expect(data).toEqual({ status: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('targets the configured API base URL', async () => {
    const mockFetch = jsonFetch({ status: 'ok' });

    await api.GET('/health', { fetch: mockFetch });

    const request = vi.mocked(mockFetch).mock.calls[0]?.[0];
    expect(String((request as Request).url)).toMatch(/\/health$/);
  });
});
