import type { ReactElement } from 'react';

import { cn } from '@/lib/utils';

/**
 * A single member's happiness bar (issue #82). `f_j ∈ [0, 1]`; the fill is
 * color-graded so low happiness reads warm and high happiness cool.
 */
export function HappinessBar({ label, value }: { label: string; value: number }): ReactElement {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const color = value < 0.4 ? 'bg-destructive' : value < 0.7 ? 'bg-amber-500' : 'bg-green-600';

  return (
    <div className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-sm">
      <span className="truncate">{label}</span>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full', color)} style={{ width: `${String(pct)}%` }} />
      </div>
      <span className="text-right tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
    </div>
  );
}
