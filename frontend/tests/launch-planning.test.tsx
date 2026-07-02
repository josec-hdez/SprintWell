import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';

vi.mock('@/api/client', () => ({
  api: { POST: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { LaunchPlanningModal } from '@/features/planning/LaunchPlanningModal';

const POST = vi.mocked(api.POST);
const noop = (): void => {};

function renderModal(): void {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <LaunchPlanningModal sprintId="s1" sprintName="Apollo" onClose={noop} />,
      },
      { path: '/planning-runs/:id', element: <div>run page</div> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  POST.mockReset();
});

describe('LaunchPlanningModal', () => {
  it('runs planning and redirects to the run on a feasible result', async () => {
    POST.mockResolvedValue({ data: { id: 'run1', status: 'OPTIMAL' }, error: undefined, response: { ok: true, status: 200 } } as never);
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /run planning/i }));

    expect(await screen.findByText('run page')).toBeInTheDocument();
    expect(POST).toHaveBeenCalledWith('/admin/sprints/{sprintId}/planning-runs', {
      params: { path: { sprintId: 's1' } },
      body: { algorithm: 'CPSAT', equityMode: 'UTILITARIAN' },
    });
  });

  it('shows a clear message on an INFEASIBLE result', async () => {
    POST.mockResolvedValue({ data: { id: 'run2', status: 'INFEASIBLE' }, error: undefined, response: { ok: true, status: 200 } } as never);
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /run planning/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no feasible plan/i);
  });

  it('surfaces an optimizer-unavailable error', async () => {
    POST.mockResolvedValue({ data: undefined, error: { message: 'down' }, response: { ok: false, status: 503 } } as never);
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /run planning/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/optimizer service is unavailable/i);
  });
});
