import type { ReactElement } from 'react';

import { cn } from '@/lib/utils';

export const BUDGET_TOTAL = 100;

/**
 * Live weight-budget bar (issue #77, brief §6.2). Shows how much of the 100-point
 * budget the member's rules consume; turns destructive when over budget.
 */
export function BudgetBar({ used }: { used: number }): ReactElement {
  const over = used > BUDGET_TOTAL;
  const pct = Math.min(100, (used / BUDGET_TOTAL) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Weight budget</span>
        <span className={cn(over && 'font-semibold text-destructive')}>
          {used} / {BUDGET_TOTAL}
          {over && ' — over budget'}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={used} aria-valuemax={BUDGET_TOTAL}>
        <div
          className={cn('h-full rounded-full transition-all', over ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${String(pct)}%` }}
        />
      </div>
    </div>
  );
}
