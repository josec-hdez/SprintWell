import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { SprintsAdmin } from '@/pages/admin/SprintsAdmin';

const GET = vi.mocked(api.GET);
const POST = vi.mocked(api.POST);

const sprint = { id: 's1', name: 'Apollo 14', startDate: '2026-05-04', durationDays: 14, tasks: [] };

beforeEach(() => {
  GET.mockReset();
  POST.mockReset();
  GET.mockImplementation((path: string) =>
    Promise.resolve(
      path === '/sprints'
        ? ({ data: [sprint], error: undefined } as never)
        : ({ data: [], error: undefined } as never),
    ),
  );
  POST.mockResolvedValue({ data: sprint, error: undefined } as never);
});

describe('SprintsAdmin', () => {
  it('lists sprints and creates one', async () => {
    render(<SprintsAdmin />);

    expect(await screen.findByText('Apollo 14')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sprint name'), { target: { value: 'Apollo 15' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-06-01' } });
    fireEvent.click(screen.getByRole('button', { name: /create sprint/i }));

    await waitFor(() => {
      expect(POST).toHaveBeenCalledWith('/admin/sprints', {
        body: { name: 'Apollo 15', startDate: '2026-06-01', durationDays: 14 },
      });
    });
  });
});
