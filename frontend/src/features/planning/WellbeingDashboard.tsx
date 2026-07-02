import type { ReactElement } from 'react';

import { HappinessBar } from '@/features/planning/HappinessBar';
import type { PlanningRun } from '@/features/planning/usePlanningRun';

/**
 * Wellbeing dashboard (issue #82, brief §2.3): the domain contribution made
 * visible. Global happiness metrics plus a per-member bar, sorted worst-off
 * first so inequity is obvious at a glance.
 */
export function WellbeingDashboard({ run }: { run: PlanningRun }): ReactElement {
  const scores = run.perUserHappiness.map((entry) => entry.happiness);
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const sorted = [...run.perUserHappiness].sort((a, b) => a.happiness - b.happiness);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Wellbeing</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Mean happiness" value={run.averageHappiness.toFixed(2)} />
        <Metric label="Min happiness" value={run.minHappiness.toFixed(2)} />
        <Metric label="Max happiness" value={max.toFixed(2)} />
      </div>

      <div className="space-y-2">
        {sorted.map((entry) => (
          <HappinessBar key={entry.userId} label={entry.userId} value={entry.happiness} />
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
