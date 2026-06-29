import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { Header } from '@/components/Header';

/**
 * Base layout (issue #65): the header plus the routed page content. Every page
 * renders inside this shell via the router's nested `<Outlet />`.
 */
export function AppLayout(): ReactElement {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
