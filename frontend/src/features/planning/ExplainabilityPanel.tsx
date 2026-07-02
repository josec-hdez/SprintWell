import type { ReactElement } from 'react';

import { useRules } from '@/features/rules/useRules';

/**
 * Assignment explainability panel (issue #85). For a member in a planning run,
 * shows the rules that shaped their schedule alongside the happiness they
 * achieved, and how `f_j` is defined.
 *
 * Note: the per-rule satisfied/not flag comes from the solver's
 * `rule_evaluations`, which are not yet persisted on the PlanningRun (the DB
 * column exists; plumbing them through the optimizer adapter → domain → view is
 * a bounded follow-up). Until then this explains via the member's rule set and
 * their resulting `f_j`.
 */
export function ExplainabilityPanel({
  userId,
  happiness,
}: {
  userId: string;
  happiness: number;
}): ReactElement {
  const { rules, isLoading, error } = useRules(userId);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">Why {userId}?</h3>
        <p className="text-sm text-muted-foreground">
          Happiness <code>f_j = {happiness.toFixed(2)}</code> — the weight-weighted fraction of this
          member&apos;s soft rules the schedule satisfies.
        </p>
      </div>

      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading rules…</p>}
      {!isLoading && rules.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">This member has no rules (f_j = 1 by convention).</p>
      )}

      {rules.length > 0 && (
        <ul className="divide-y rounded-md border text-sm">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="font-medium">
                {rule.type}
                {rule.isHard && (
                  <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                    hard
                  </span>
                )}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                weight {rule.weight} · {JSON.stringify(rule.params)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
