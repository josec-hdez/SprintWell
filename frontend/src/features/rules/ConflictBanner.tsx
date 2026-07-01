import type { ReactElement } from 'react';

import type { RuleConflict } from '@/features/rules/useRules';

/**
 * Conflict banner (issue #77, brief §6.4). Renders the antagonistic-rule
 * conflicts the backend detected; nothing when there are none.
 */
export function ConflictBanner({ conflicts }: { conflicts: RuleConflict[] }): ReactElement | null {
  if (conflicts.length === 0) {
    return null;
  }
  return (
    <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
      <p className="text-sm font-medium text-destructive">
        {conflicts.length} rule {conflicts.length === 1 ? 'conflict' : 'conflicts'} detected
      </p>
      <ul className="mt-1 list-disc pl-5 text-sm text-destructive">
        {conflicts.map((conflict) => (
          <li key={conflict.ruleIds.join('-')}>{conflict.description}</li>
        ))}
      </ul>
    </div>
  );
}
