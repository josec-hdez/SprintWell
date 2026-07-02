import type { ReactElement } from 'react';
import { useParams } from 'react-router';

import { GanttView } from '@/features/planning/GanttView';
import { usePlanningRun } from '@/features/planning/usePlanningRun';

/**
 * Planning-run view (issue #81): the run's metadata plus a Gantt of its
 * assignments by member and day. Handles loading, error and INFEASIBLE runs.
 */
export function PlanningRunView(): ReactElement {
  const { id = '' } = useParams();
  const { run, sprint, isLoading, error } = usePlanningRun(id);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading plan…</p>;
  }
  if (error !== null || run === null) {
    return (
      <p role="alert" className="text-destructive">
        {error ?? 'Could not load the plan.'}
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Planning run</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {run.strategy} · {run.equityMode} · {run.status}
        </p>
        {run.status !== 'INFEASIBLE' && (
          <p className="mt-1 text-sm text-muted-foreground">
            Mean happiness {run.averageHappiness.toFixed(2)} · min {run.minHappiness.toFixed(2)}
          </p>
        )}
      </div>

      {run.status === 'INFEASIBLE' || run.assignments.length === 0 ? (
        <p role="alert" className="text-destructive">
          No feasible plan exists for this sprint with the current tasks and rules.
        </p>
      ) : sprint === null ? (
        <p className="text-muted-foreground">Assignments are ready, but the sprint could not be loaded.</p>
      ) : (
        <GanttView run={run} sprint={sprint} />
      )}
    </section>
  );
}
