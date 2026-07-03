import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e config (issue #89). The specs drive the real UI but mock the
 * backend via route interception, so they run against `vite dev` alone — no
 * database, optimizer or backend needed. This keeps the critical-flow coverage
 * fast and reliable in CI without orchestrating the full docker-compose stack.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
