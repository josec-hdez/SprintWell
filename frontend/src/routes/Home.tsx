import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { apiBaseUrl } from '@/lib/http';

export function Home(): ReactElement {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">SprintWell</h1>
        <p className="text-muted-foreground">Frontend bootstrap.</p>
        <p className="text-xs text-muted-foreground">
          API: <code>{apiBaseUrl}</code>
        </p>
        <Button>Click me</Button>
      </div>
    </main>
  );
}
