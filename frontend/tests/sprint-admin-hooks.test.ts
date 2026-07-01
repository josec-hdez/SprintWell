import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { useSprintsAdmin } from '@/features/sprint/admin/useSprintsAdmin';
import { useSprintTasks } from '@/features/sprint/admin/useSprintTasks';

const GET = vi.mocked(api.GET);
const POST = vi.mocked(api.POST);
const DELETE = vi.mocked(api.DELETE);
const PATCH = vi.mocked(api.PATCH);

const sprint = { id: 's1', name: 'S1', startDate: '2026-05-04', durationDays: 14, tasks: [] };
const task = {
  id: 't1',
  name: 'T1',
  effortDays: 2,
  category: 'feature',
  domain: 'auth',
  deadlineDay: null,
  requiredSkills: [],
  dependsOn: [],
  status: 'TODO',
};

beforeEach(() => {
  GET.mockReset();
  POST.mockReset();
  DELETE.mockReset();
  PATCH.mockReset();
});

describe('useSprintsAdmin', () => {
  it('lists, creates and deletes sprints', async () => {
    GET.mockResolvedValue({ data: [sprint], error: undefined } as never);
    POST.mockResolvedValue({ data: sprint, error: undefined } as never);
    DELETE.mockResolvedValue({ data: undefined, error: undefined } as never);

    const { result } = renderHook(() => useSprintsAdmin());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.sprints).toHaveLength(1);

    await act(async () => {
      await result.current.createSprint({ name: 'S2', startDate: '2026-06-01', durationDays: 10 });
    });
    expect(POST).toHaveBeenCalledWith('/admin/sprints', {
      body: { name: 'S2', startDate: '2026-06-01', durationDays: 10 },
    });

    await act(async () => {
      await result.current.deleteSprint('s1');
    });
    expect(DELETE).toHaveBeenCalledWith('/admin/sprints/{id}', { params: { path: { id: 's1' } } });
  });
});

describe('useSprintTasks', () => {
  it('loads tasks and runs task mutations', async () => {
    GET.mockResolvedValue({ data: { ...sprint, tasks: [task] }, error: undefined } as never);
    POST.mockResolvedValue({ data: task, error: undefined } as never);
    DELETE.mockResolvedValue({ data: undefined, error: undefined } as never);
    PATCH.mockResolvedValue({ data: undefined, error: undefined } as never);

    const { result } = renderHook(() => useSprintTasks('s1'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(GET).toHaveBeenCalledWith('/sprints/{id}', { params: { path: { id: 's1' } } });

    await act(async () => {
      await result.current.addTask({
        name: 'New',
        effortDays: 1,
        category: 'BUG',
        domain: 'billing',
        requiredSkills: [],
        dependsOn: [],
      });
    });
    expect(POST).toHaveBeenCalledWith('/admin/sprints/{id}/tasks', {
      params: { path: { id: 's1' } },
      body: expect.objectContaining({ name: 'New', category: 'BUG' }),
    });

    await act(async () => {
      await result.current.changeStatus('t1', 'DONE');
    });
    expect(PATCH).toHaveBeenCalledWith('/admin/sprints/{id}/tasks/{taskId}/status', {
      params: { path: { id: 's1', taskId: 't1' } },
      body: { status: 'DONE' },
    });

    await act(async () => {
      await result.current.removeTask('t1');
    });
    expect(DELETE).toHaveBeenCalledWith('/admin/sprints/{id}/tasks/{taskId}', {
      params: { path: { id: 's1', taskId: 't1' } },
    });
  });
});
