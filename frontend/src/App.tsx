import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { AppLayout } from '@/layouts/AppLayout';
import { Login } from '@/pages/Login';
import { PublicSprintDetail } from '@/pages/PublicSprintDetail';
import { PublicSprints } from '@/pages/PublicSprints';
// Side-effect import: registers the bearer-token middleware on the API client.
import '@/stores/auth.store';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <PublicSprints /> },
      { path: 'sprints/:id', element: <PublicSprintDetail /> },
      { path: 'login', element: <Login /> },
    ],
  },
]);

export function App(): ReactElement {
  return <RouterProvider router={router} />;
}
