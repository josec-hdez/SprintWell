import { test, expect } from '@playwright/test';

import { seedAuth, json } from './support';

test.describe('task status flow', () => {
  test('changes a task status after confirmation', async ({ page }) => {
    await seedAuth(page, 'MEMBER');
    page.on('dialog', (dialog) => {
      void dialog.accept();
    });

    const task = {
      sprintId: 's1',
      sprintName: 'Apollo',
      taskId: 't1',
      taskName: 'OAuth login',
      category: 'feature',
      effortDays: 2,
      startDay: 0,
      status: 'TODO',
    };

    await page.route('**/me/tasks', (route) => json(route, [task]));
    await page.route('**/tasks/*/status', (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON() as { status: string };
        task.status = body.status;
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });

    await page.goto('/my-tasks');
    const select = page.getByLabel(/status of oauth login/i);
    await expect(select).toHaveValue('TODO');

    await select.selectOption('IN_PROGRESS');

    // After confirmation + PATCH the list reloads with the new status.
    await expect(page.getByLabel(/status of oauth login/i)).toHaveValue('IN_PROGRESS');
  });
});
