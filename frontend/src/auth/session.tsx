import { useAuthStore } from '@/stores/auth.store';

/**
 * Session contract consumed by the UI (issue #65). Originally backed by a
 * placeholder context; since issue #67 it is backed by the real auth store, so
 * `useSession` is now a thin, reactive read over `useAuthStore`. The shape is
 * unchanged, so the layout and header did not have to move.
 */

export type Role = 'anonymous' | 'member' | 'admin';

export interface SessionUser {
  id: string;
  name: string;
  role: Exclude<Role, 'anonymous'>;
}

export interface Session {
  /** The authenticated user, or `null` when anonymous. */
  user: SessionUser | null;
  /** Convenience: the user's role, or `'anonymous'`. */
  role: Role;
  /** Clears the session (delegates to the auth store). */
  logout: () => void;
}

export function useSession(): Session {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  return { user, role: user?.role ?? 'anonymous', logout };
}
