import { test, expect } from '@playwright/test';

import { seedAuth, json } from './support';

test.describe('rule editor flow', () => {
  test('adds a rule and the budget updates', async ({ page }) => {
    await seedAuth(page, 'MEMBER');

    // Stateful rules mock: GET returns the list, PUT appends to it.
    const rules: Array<Record<string, unknown>> = [];
    await page.route('**/me/rules**', (route) => {
      const request = route.request();
      const url = request.url();
      if (url.endsWith('/conflicts')) {
        return json(route, []);
      }
      if (request.method() === 'GET') {
        return json(route, rules);
      }
      if (request.method() === 'PUT') {
        const body = request.postDataJSON() as Record<string, unknown>;
        rules.push({
          id: `r${String(rules.length)}`,
          ownerId: 'u1',
          enabled: true,
          schemaVersion: 1,
          ...body,
        });
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/my-rules');
    await expect(page.getByText(/no rules yet/i)).toBeVisible();
    await expect(page.getByText('0 / 100')).toBeVisible();

    await page.getByRole('button', { name: /add rule/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /save rule/i }).click();

    // The default rule (PREFER_CATEGORY, weight 20) appears and the budget grows.
    await expect(page.getByText('PREFER_CATEGORY')).toBeVisible();
    await expect(page.getByText('20 / 100')).toBeVisible();
  });
});
