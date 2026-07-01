import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { useMembers } from '@/features/team/useMembers';
import { useSkills } from '@/features/team/useSkills';

const GET = vi.mocked(api.GET);
const POST = vi.mocked(api.POST);
const DELETE = vi.mocked(api.DELETE);

const member = { id: 'u1', email: 'a@x.com', name: 'Ana', role: 'MEMBER' };

beforeEach(() => {
  GET.mockReset();
  POST.mockReset();
  DELETE.mockReset();
});

describe('useMembers', () => {
  it('loads members on mount', async () => {
    GET.mockResolvedValue({ data: [member], error: undefined } as never);

    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.members).toEqual([member]);
    expect(GET).toHaveBeenCalledWith('/admin/members');
  });

  it('sets an error when loading fails', async () => {
    GET.mockResolvedValue({ data: undefined, error: { message: 'no' } } as never);

    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.error).toMatch(/could not load members/i);
    });
  });

  it('creates a member and reloads', async () => {
    GET.mockResolvedValue({ data: [], error: undefined } as never);
    POST.mockResolvedValue({ data: member, error: undefined } as never);

    const { result } = renderHook(() => useMembers());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createMember({
        email: 'a@x.com',
        name: 'Ana',
        role: 'MEMBER',
        initialPassword: 'secret12',
      });
    });

    expect(POST).toHaveBeenCalledWith('/admin/members', {
      body: { email: 'a@x.com', name: 'Ana', role: 'MEMBER', initialPassword: 'secret12' },
    });
    expect(GET).toHaveBeenCalledTimes(2); // mount + reload
  });

  it('assigns a skill to a member', async () => {
    GET.mockResolvedValue({ data: [member], error: undefined } as never);
    POST.mockResolvedValue({ data: undefined, error: undefined } as never);

    const { result } = renderHook(() => useMembers());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.assignSkill('u1', 'skill-1', 4);
    });

    expect(POST).toHaveBeenCalledWith('/admin/members/{id}/skills', {
      params: { path: { id: 'u1' } },
      body: { skillId: 'skill-1', level: 4 },
    });
  });
});

describe('useSkills', () => {
  it('loads skills and creates one', async () => {
    GET.mockResolvedValue({ data: [{ id: 's1', name: 'backend' }], error: undefined } as never);
    POST.mockResolvedValue({ data: { id: 's2', name: 'devops' }, error: undefined } as never);

    const { result } = renderHook(() => useSkills());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.skills).toHaveLength(1);

    await act(async () => {
      await result.current.createSkill('devops');
    });
    expect(POST).toHaveBeenCalledWith('/admin/skills', { body: { name: 'devops' } });
  });
});
