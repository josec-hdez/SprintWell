import type { ReactElement } from 'react';
import { Navigate } from 'react-router';

import { useSession } from '@/auth/session';

/**
 * Route guard (issue #73): only admins may see the wrapped content. Anonymous
 * or member sessions are redirected to the login screen. The backend endpoints
 * are independently protected by the AdminGuard — this is UX, not the security
 * boundary.
 */
export function RequireAdmin({ children }: { children: ReactElement }): ReactElement {
  const { role } = useSession();
  if (role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}
