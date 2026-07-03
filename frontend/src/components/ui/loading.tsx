import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Unified loading indicator (issue #90): a spinner plus a label, used across
 * screens so every loading state looks the same. The label text is unchanged
 * from the old bare-text states.
 */
export function Loading({ label = 'Loading…', className }: { label?: string; className?: string }): ReactElement {
  return (
    <p role="status" className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}
