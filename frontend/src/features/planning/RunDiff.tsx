import type { ReactElement } from 'react';

import type { PlanningRun } from '@/features/planning/usePlanningRun';
import { cn } from '@/lib/utils';

/**
 * Metric and assignment diff between two planning runs of the same sprint
 * (issue #88) — the visual that materializes "equity matters" (H1).
 */
export function RunDiff({ runA, runB }: { runA: PlanningRun; runB: PlanningRun }): ReactElement {
  const maxOf = (run: PlanningRun): number =>
    run.perUserHappiness.length > 0
      ? Math.max(...run.perUserHappiness.map((entry) => entry.happiness))
      : 0;

  const users = [
    ...new Set([...runA.perUserHappiness, ...runB.perUserHappiness].map((entry) => entry.userId)),
  ].sort((a, b) => a.localeCompare(b));
  const happinessOf = (run: PlanningRun, userId: string): number | undefined =>
    run.perUserHappiness.find((entry) => entry.userId === userId)?.happiness;

  const assigneeOf = (run: PlanningRun): Map<string, { userId: string; startDay: number }> =>
    new Map(run.assignments.map((a) => [a.taskId, { userId: a.userId, startDay: a.startDay }]));
  const aMap = assigneeOf(runA);
  const bMap = assigneeOf(runB);
  const changedTasks = [...new Set([...aMap.keys(), ...bMap.keys()])].filter((taskId) => {
    const a = aMap.get(taskId);
    const b = bMap.get(taskId);
    return a?.userId !== b?.userId || a?.startDay !== b?.startDay;
  });

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-medium">Global metrics</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-1">Metric</th>
              <th className="py-1">A</th>
              <th className="py-1">B</th>
              <th className="py-1">Δ</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Algorithm" a={runA.strategy} b={runB.strategy} />
            <Row label="Equity mode" a={runA.equityMode} b={runB.equityMode} />
            <Row label="Status" a={runA.status} b={runB.status} />
            <NumRow label="Mean happiness" a={runA.averageHappiness} b={runB.averageHappiness} />
            <NumRow label="Min happiness" a={runA.minHappiness} b={runB.minHappiness} />
            <NumRow label="Max happiness" a={maxOf(runA)} b={maxOf(runB)} />
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="mb-2 font-medium">Per-member happiness</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-1">Member</th>
              <th className="py-1">A</th>
              <th className="py-1">B</th>
              <th className="py-1">Δ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userId) => (
              <NumRow
                key={userId}
                label={userId}
                a={happinessOf(runA, userId)}
                b={happinessOf(runB, userId)}
              />
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="mb-2 font-medium">
          Assignment changes ({changedTasks.length})
        </h3>
        {changedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Both runs assign every task identically.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {changedTasks.map((taskId) => {
              const a = aMap.get(taskId);
              const b = bMap.get(taskId);
              return (
                <li key={taskId} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{taskId}</span>:{' '}
                  {a ? `${a.userId} (day ${String(a.startDay)})` : '—'} →{' '}
                  {b ? `${b.userId} (day ${String(b.startDay)})` : '—'}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }): ReactElement {
  return (
    <tr className="border-t">
      <td className="py-1">{label}</td>
      <td className="py-1">{a}</td>
      <td className="py-1">{b}</td>
      <td className="py-1 text-muted-foreground">{a === b ? '=' : '≠'}</td>
    </tr>
  );
}

function NumRow({
  label,
  a,
  b,
}: {
  label: string;
  a: number | undefined;
  b: number | undefined;
}): ReactElement {
  const delta = a !== undefined && b !== undefined ? b - a : undefined;
  return (
    <tr className="border-t">
      <td className="py-1">{label}</td>
      <td className="py-1 tabular-nums">{a?.toFixed(2) ?? '—'}</td>
      <td className="py-1 tabular-nums">{b?.toFixed(2) ?? '—'}</td>
      <td
        className={cn(
          'py-1 tabular-nums',
          delta !== undefined && delta > 0 && 'text-green-600',
          delta !== undefined && delta < 0 && 'text-destructive',
        )}
      >
        {delta === undefined ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
      </td>
    </tr>
  );
}
