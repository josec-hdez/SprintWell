import type { Page, Route } from '@playwright/test';

/**
 * Shared helpers for the e2e specs (issue #89). The backend is mocked with
 * route interception, so a fake — but structurally valid — JWT stands in for a
 * real login token.
 */
export function fakeJwt(claims: { sub: string; email: string; role: 'MEMBER' | 'ADMIN' }): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `header.${payload}.signature`;
}

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/** Mocks POST /auth/login to return a token for the given role. */
export async function mockLogin(page: Page, role: 'MEMBER' | 'ADMIN'): Promise<void> {
  await page.route('**/auth/login', (route) =>
    json(route, { accessToken: fakeJwt({ sub: 'u1', email: 'user@x.com', role }) }),
  );
}

/** Convenience: a JSON GET/POST/PUT/PATCH/DELETE mock for a URL glob. */
export async function mockJson(page: Page, urlGlob: string, body: unknown, status = 200): Promise<void> {
  await page.route(urlGlob, (route) => json(route, body, status));
}

/**
 * Seeds an authenticated session directly into localStorage (the zustand
 * persist format), so member/admin flows don't have to log in through the UI.
 */
export async function seedAuth(page: Page, role: 'MEMBER' | 'ADMIN'): Promise<void> {
  const user = { id: 'u1', name: 'user@x.com', role: role === 'ADMIN' ? 'admin' : 'member' };
  const token = fakeJwt({ sub: 'u1', email: 'user@x.com', role });
  await page.addInitScript(
    ([t, u]) => {
      window.localStorage.setItem(
        'sprintwell-auth',
        JSON.stringify({ state: { token: t, user: u }, version: 0 }),
      );
    },
    [token, user] as const,
  );
}

export { json };
