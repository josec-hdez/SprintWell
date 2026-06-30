import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { AppLayout } from '@/layouts/AppLayout';
import { Home } from '@/routes/Home';
// Side-effect import: registers the bearer-token middleware on the API client.
import '@/stores/auth.store';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ index: true, element: <Home /> }],
  },
]);

export function App(): ReactElement {
  return <RouterProvider router={router} />;
}
