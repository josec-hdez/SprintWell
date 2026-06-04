import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { Home } from '@/routes/Home';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
]);

export function App(): ReactElement {
  return <RouterProvider router={router} />;
}
