import { test, expect } from '@playwright/test';

import { mockLogin, mockJson } from './support';

test.describe('login flow', () => {
  test('signs in and lands on the public sprint listing', async ({ page }) => {
    await mockLogin(page, 'MEMBER');
    await mockJson(page, '**/sprints', []);

    await page.goto('/login');
    await page.getByLabel('Email').fill('user@x.com');
    await page.getByLabel('Password').fill('secret12');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Redirected to the home (public sprints) — empty state renders.
    await expect(page.getByText(/no sprints yet/i)).toBeVisible();
    // The header now shows the member menu, not a Login link.
    await expect(page.getByRole('link', { name: /login/i })).toHaveCount(0);
  });

  test('shows an error on invalid credentials', async ({ page }) => {
    await page.route('**/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"bad"}' }),
    );

    await page.goto('/login');
    await page.getByLabel('Email').fill('user@x.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
  });
});
