import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

/**
 * Minimal session seam (issue #65). The base layout needs to know the current
 * role to render role-conditional navigation, but the real auth store (login,
 * logout, JWT persistence) lands in issue #67. This context is the contract the
 * layout depends on; #67 backs it with the actual store without touching the UI.
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
  /** Clears the session. #67 replaces this with token-aware logout. */
  logout: () => void;
}

const SessionContext = createContext<Session | null>(null);

export interface SessionProviderProps {
  children: ReactNode;
  /** Seeds the session — used by tests and, later, by the auth store. */
  initialUser?: SessionUser | null;
}

export function SessionProvider({
  children,
  initialUser = null,
}: SessionProviderProps): ReactElement {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const logout = useCallback(() => {
    setUser(null);
  }, []);
  const value = useMemo<Session>(
    () => ({ user, role: user?.role ?? 'anonymous', logout }),
    [user, logout],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (ctx === null) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
