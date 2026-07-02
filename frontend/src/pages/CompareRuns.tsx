import { useState } from 'react';
import type { ReactElement } from 'react';

import { GanttView } from '@/features/planning/GanttView';
import { RunDiff } from '@/features/planning/RunDiff';
import { useSprintRuns } from '@/features/planning/useSprintRuns';
import { useSprintList } from '@/features/sprint/useSprintList';
import { cn } from '@/lib/utils';

const SELECT = cn(
  'h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);

/**
 * Side-by-side comparator of two planning runs of the same sprint (issue #88):
 * pick a sprint and two of its runs, then see both Gantts, the metric diff and
 * the per-member happiness delta — the visual proof that equity mode / algorithm
 * reshape the plan.
 */
export function CompareRuns(): ReactElement {
  const { sprints } = useSprintList();
  const [sprintId, setSprintId] = useState('');
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const { runs, isLoading, error } = useSprintRuns(sprintId);

  const sprint = sprints.find((entry) => entry.id === sprintId);
  const runA = runs.find((run) => run.id === runAId);
  const runB = runs.find((run) => run.id === runBId);

  function runLabel(run: (typeof runs)[number]): string {
    return `${run.strategy} · ${run.equityMode} · ${run.status}`;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Compare planning runs</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Sprint
          <select
            aria-label="Sprint"
            value={sprintId}
            onChange={(event) => {
              setSprintId(event.target.value);
              setRunAId('');
              setRunBId('');
            }}
            className={SELECT}
          >
            <option value="">Select a sprint…</option>
            {sprints.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Run A
          <select
            aria-label="Run A"
            value={runAId}
            onChange={(event) => {
              setRunAId(event.target.value);
            }}
            className={SELECT}
            disabled={runs.length === 0}
          >
            <option value="">Select a run…</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {runLabel(run)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Run B
          <select
            aria-label="Run B"
            value={runBId}
            onChange={(event) => {
              setRunBId(event.target.value);
            }}
            className={SELECT}
            disabled={runs.length === 0}
          >
            <option value="">Select a run…</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {runLabel(run)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading runs…</p>}
      {sprintId !== '' && !isLoading && runs.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">This sprint has no planning runs yet.</p>
      )}

      {runA !== undefined && runB !== undefined && (
        <>
          <RunDiff runA={runA} runB={runB} />
          {sprint !== undefined && (
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium">Run A — {runA.equityMode}</h3>
                <GanttView run={runA} sprint={sprint} />
              </div>
              <div>
                <h3 className="mb-2 font-medium">Run B — {runB.equityMode}</h3>
                <GanttView run={runB} sprint={sprint} />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
