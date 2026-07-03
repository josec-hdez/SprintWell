import { test, expect } from '@playwright/test';

import { seedAuth, json } from './support';

const sprint = {
  id: 's1',
  name: 'Apollo Sprint',
  startDate: '2026-05-04',
  durationDays: 10,
  tasks: [
    {
      id: 't1',
      name: 'OAuth login',
      effortDays: 2,
      category: 'feature',
      domain: 'auth',
      deadlineDay: null,
      requiredSkills: [],
      dependsOn: [],
      status: 'TODO',
    },
  ],
};
const run = {
  id: 'run1',
  sprintId: 's1',
  strategy: 'CPSAT',
  equityMode: 'NASH',
  status: 'OPTIMAL',
  objectiveValue: 100,
  assignments: [{ taskId: 't1', userId: 'ana', startDay: 0 }],
  perUserHappiness: [{ userId: 'ana', happiness: 0.9 }],
  averageHappiness: 0.9,
  minHappiness: 0.9,
  createdAt: '2026-05-04T00:00:00.000Z',
};

test.describe('planning flow', () => {
  test('launches a plan and shows the Gantt and wellbeing', async ({ page }) => {
    await seedAuth(page, 'ADMIN');

    // Match the API origin exactly so these don't intercept SPA navigations
    // to look-alike client routes (e.g. /admin/sprints, /planning-runs/:id).
    const API = 'http://localhost:3000';
    await page.route(`${API}/sprints`, (route) => json(route, [sprint]));
    await page.route(`${API}/sprints/s1`, (route) => json(route, sprint));
    await page.route(`${API}/admin/sprints/s1/planning-runs`, (route) => json(route, run));
    await page.route(`${API}/planning-runs/run1`, (route) => json(route, run));

    await page.goto('/admin/sprints');
    await page.getByRole('button', { name: /^plan$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /run planning/i }).click();

    // Redirected to the planning-run view: Gantt (task) + wellbeing metrics.
    await expect(page.getByRole('heading', { name: /planning run/i })).toBeVisible();
    await expect(page.getByText('OAuth login')).toBeVisible();
    await expect(page.getByRole('heading', { name: /wellbeing/i })).toBeVisible();
  });
});
