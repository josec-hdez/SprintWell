import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the typed client so the store never touches the network. `use` is a
// no-op here (the real middleware registration is exercised in integration).
vi.mock('@/api/client', () => ({
  api: { POST: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';

/** Builds a JWT whose payload carries the given claims (signature ignored). */
function fakeJwt(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${payload}.signature`;
}

const POST = vi.mocked(api.POST);

describe('auth store', () => {
  beforeEach(() => {
    POST.mockReset();
    useAuthStore.setState({ user: null, token: null });
    localStorage.clear();
  });

  it('login stores the JWT and the decoded user', async () => {
    const token = fakeJwt({ sub: 'u1', email: 'admin@x.com', role: 'ADMIN' });
    POST.mockResolvedValue({ data: { accessToken: token }, error: undefined } as never);

    await useAuthStore.getState().login({ email: 'admin@x.com', password: 'secret' });

    const state = useAuthStore.getState();
    expect(state.token).toBe(token);
    expect(state.user).toEqual({ id: 'u1', name: 'admin@x.com', role: 'admin' });
    expect(POST).toHaveBeenCalledWith('/auth/login', {
      body: { email: 'admin@x.com', password: 'secret' },
    });
  });

  it('login throws and keeps the session empty on error', async () => {
    POST.mockResolvedValue({ data: undefined, error: { message: 'nope' } } as never);

    await expect(
      useAuthStore.getState().login({ email: 'a@x.com', password: 'bad' }),
    ).rejects.toThrow(/invalid/i);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('logout clears the state', () => {
    useAuthStore.setState({ user: { id: 'u1', name: 'a', role: 'member' }, token: 't' });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('persists the token to localStorage so it survives a reload', async () => {
    const token = fakeJwt({ sub: 'u2', email: 'm@x.com', role: 'MEMBER' });
    POST.mockResolvedValue({ data: { accessToken: token }, error: undefined } as never);

    await useAuthStore.getState().login({ email: 'm@x.com', password: 'secret' });

    const persisted = localStorage.getItem('sprintwell-auth');
    expect(persisted).not.toBeNull();
    expect(persisted).toContain(token);
  });
});
