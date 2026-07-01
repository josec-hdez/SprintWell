import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { RequireAdmin } from '@/components/RequireAdmin';
import { RequireAuth } from '@/components/RequireAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { Login } from '@/pages/Login';
import { PublicSprintDetail } from '@/pages/PublicSprintDetail';
import { PublicSprints } from '@/pages/PublicSprints';
import { MyTasks } from '@/pages/member/MyTasks';
import { SprintsAdmin } from '@/pages/admin/SprintsAdmin';
import { TeamAdmin } from '@/pages/admin/TeamAdmin';
// Side-effect import: registers the bearer-token middleware on the API client.
import '@/stores/auth.store';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <PublicSprints /> },
      { path: 'sprints/:id', element: <PublicSprintDetail /> },
      { path: 'login', element: <Login /> },
      {
        path: 'my-tasks',
        element: (
          <RequireAuth>
            <MyTasks />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/team',
        element: (
          <RequireAdmin>
            <TeamAdmin />
          </RequireAdmin>
        ),
      },
      {
        path: 'admin/sprints',
        element: (
          <RequireAdmin>
            <SprintsAdmin />
          </RequireAdmin>
        ),
      },
    ],
  },
]);

export function App(): ReactElement {
  return <RouterProvider router={router} />;
}
