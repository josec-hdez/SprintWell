import type { ReactElement } from 'react';
import { Navigate } from 'react-router';

import { useSession } from '@/auth/session';

/**
 * Route guard (issue #75): any authenticated user may see the wrapped content;
 * anonymous visitors are redirected to login. The endpoints are independently
 * protected server-side — this is UX.
 */
export function RequireAuth({ children }: { children: ReactElement }): ReactElement {
  const { user } = useSession();
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
