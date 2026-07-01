import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { PublicSprintDetail } from '@/pages/PublicSprintDetail';

const GET = vi.mocked(api.GET);

function task(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    name: `Task ${id}`,
    effortDays: 2,
    category: 'feature',
    domain: 'auth',
    deadlineDay: null,
    requiredSkills: [],
    dependsOn: [],
    status: 'TODO',
    ...overrides,
  };
}

function renderDetail(): void {
  const router = createMemoryRouter(
    [{ path: '/sprints/:id', element: <PublicSprintDetail /> }],
    { initialEntries: ['/sprints/s1'] },
  );
  render(<RouterProvider router={router} />);
}

describe('PublicSprintDetail', () => {
  beforeEach(() => {
    GET.mockReset();
  });

  it('renders metadata and the task table', async () => {
    GET.mockResolvedValue({
      data: {
        id: 's1',
        name: 'Apollo Sprint',
        startDate: '2026-05-04',
        durationDays: 14,
        tasks: [task('t1', { name: 'OAuth login', status: 'DONE' })],
      },
      error: undefined,
    } as never);

    renderDetail();

    expect(await screen.findByRole('heading', { name: /apollo sprint/i })).toBeInTheDocument();
    expect(screen.getByText('OAuth login')).toBeInTheDocument();
    expect(screen.getByText('DONE')).toBeInTheDocument();
    expect(GET).toHaveBeenCalledWith('/sprints/{id}', { params: { path: { id: 's1' } } });
  });

  it('shows an empty-tasks message', async () => {
    GET.mockResolvedValue({
      data: { id: 's1', name: 'Empty', startDate: '2026-05-04', durationDays: 7, tasks: [] },
      error: undefined,
    } as never);

    renderDetail();

    expect(await screen.findByText(/no tasks in this sprint/i)).toBeInTheDocument();
  });

  it('shows an error when the sprint cannot be loaded', async () => {
    GET.mockResolvedValue({ data: undefined, error: { message: 'not found' } } as never);

    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent(/not found or unavailable/i);
  });
});
