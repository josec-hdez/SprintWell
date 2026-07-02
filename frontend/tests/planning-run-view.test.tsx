import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { PlanningRunView } from '@/pages/PlanningRunView';

const GET = vi.mocked(api.GET);

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
const sprint = {
  id: 's1',
  name: 'Apollo',
  startDate: '2026-05-04',
  durationDays: 5,
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
      status: 'IN_PROGRESS',
    },
  ],
};

function renderView(): void {
  const router = createMemoryRouter([{ path: '/planning-runs/:id', element: <PlanningRunView /> }], {
    initialEntries: ['/planning-runs/run1'],
  });
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  GET.mockReset();
});

describe('PlanningRunView', () => {
  it('renders the gantt with the assigned task', async () => {
    GET.mockImplementation((path: string) =>
      Promise.resolve(
        path === '/planning-runs/{id}'
          ? ({ data: run, error: undefined } as never)
          : ({ data: sprint, error: undefined } as never),
      ),
    );

    renderView();

    expect(await screen.findByRole('heading', { name: /planning run/i })).toBeInTheDocument();
    expect(screen.getByText('OAuth login')).toBeInTheDocument();
    expect(screen.getByText('ana')).toBeInTheDocument();
  });

  it('shows an INFEASIBLE message', async () => {
    GET.mockResolvedValue({
      data: { ...run, status: 'INFEASIBLE', assignments: [] },
      error: undefined,
    } as never);

    renderView();

    expect(await screen.findByRole('alert')).toHaveTextContent(/no feasible plan/i);
  });

  it('shows an error when the run cannot be loaded', async () => {
    GET.mockResolvedValue({ data: undefined, error: { message: 'nope' } } as never);

    renderView();

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load the plan/i);
  });
});
