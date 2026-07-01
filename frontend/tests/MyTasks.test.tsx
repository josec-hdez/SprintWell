import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), PATCH: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { MyTasks } from '@/pages/member/MyTasks';

const GET = vi.mocked(api.GET);
const PATCH = vi.mocked(api.PATCH);

const task = {
  sprintId: 's1',
  sprintName: 'Apollo',
  taskId: 't1',
  taskName: 'OAuth login',
  category: 'feature',
  effortDays: 3,
  startDay: 0,
  status: 'TODO',
};

beforeEach(() => {
  GET.mockReset();
  PATCH.mockReset();
  GET.mockResolvedValue({ data: [task], error: undefined } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MyTasks', () => {
  it('changes status after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    PATCH.mockResolvedValue({ error: undefined, response: { ok: true, status: 204 } } as never);

    render(<MyTasks />);
    const select = await screen.findByLabelText(/status of oauth login/i);

    fireEvent.change(select, { target: { value: 'IN_PROGRESS' } });

    await waitFor(() => {
      expect(PATCH).toHaveBeenCalledWith('/tasks/{id}/status', {
        params: { path: { id: 't1' } },
        body: { status: 'IN_PROGRESS' },
      });
    });
  });

  it('does not change status when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<MyTasks />);
    const select = await screen.findByLabelText(/status of oauth login/i);
    fireEvent.change(select, { target: { value: 'DONE' } });

    expect(PATCH).not.toHaveBeenCalled();
  });

  it('shows a readable error on a 403', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    PATCH.mockResolvedValue({ error: { message: 'forbidden' }, response: { ok: false, status: 403 } } as never);

    render(<MyTasks />);
    const select = await screen.findByLabelText(/status of oauth login/i);
    fireEvent.change(select, { target: { value: 'DONE' } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/only change your own tasks/i);
  });

  it('shows an empty state with no tasks', async () => {
    GET.mockResolvedValue({ data: [], error: undefined } as never);
    render(<MyTasks />);
    expect(await screen.findByText(/no assigned tasks/i)).toBeInTheDocument();
  });
});
