import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api } from '@/api/client';
import type { Role, SessionUser } from '@/auth/session';

/**
 * Auth store (issue #67). Central, reactive session state: `login` exchanges
 * credentials for a JWT via the typed client, `logout` clears everything, and
 * the token+user are persisted to localStorage so the session survives a
 * reload. The bearer token is injected into every API call by the middleware
 * registered at the bottom of this module.
 */

export interface Credentials {
  email: string;
  password: string;
}

interface JwtClaims {
  sub: string;
  email: string;
  role: string;
}

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

/** Reads the (unverified) claims from a JWT payload — enough to label the UI. */
function decodeClaims(token: string): JwtClaims | null {
  const payload = token.split('.')[1];
  if (payload === undefined) {
    return null;
  }
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

function toRole(value: string): Exclude<Role, 'anonymous'> {
  return value.toUpperCase() === 'ADMIN' ? 'admin' : 'member';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async ({ email, password }: Credentials) => {
        const { data, error } = await api.POST('/auth/login', { body: { email, password } });
        if (error !== undefined || data === undefined) {
          throw new Error('Invalid email or password.');
        }
        const claims = decodeClaims(data.accessToken);
        const user: SessionUser =
          claims !== null
            ? { id: claims.sub, name: claims.email, role: toRole(claims.role) }
            : { id: 'unknown', name: email, role: 'member' };
        set({ token: data.accessToken, user });
      },
      logout: () => {
        set({ token: null, user: null });
      },
    }),
    {
      name: 'sprintwell-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

// Inject the bearer token into every request. Registered here rather than in
// client.ts so the client module never imports the store (avoids a cycle).
api.use({
  onRequest({ request }) {
    const { token } = useAuthStore.getState();
    if (token !== null) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
});
