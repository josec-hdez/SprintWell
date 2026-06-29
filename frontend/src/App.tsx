import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { SessionProvider } from '@/auth/session';
import { AppLayout } from '@/layouts/AppLayout';
import { Home } from '@/routes/Home';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ index: true, element: <Home /> }],
  },
]);

export function App(): ReactElement {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}
