import { useState } from 'react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { BudgetBar, BUDGET_TOTAL } from '@/features/rules/BudgetBar';
import { ConflictBanner } from '@/features/rules/ConflictBanner';
import { RuleModal } from '@/features/rules/RuleModal';
import type { UpsertRule } from '@/features/rules/useRules';
import { useRules } from '@/features/rules/useRules';

/**
 * Member rule editor (issue #77, brief §6). Live weight-budget bar, an add-rule
 * modal with per-type fields, and a banner for backend-detected conflicts.
 */
export function RuleEditor({
  ownerId,
  title = 'My rules',
}: {
  ownerId?: string;
  title?: string;
} = {}): ReactElement {
  const { rules, conflicts, isLoading, error, upsert, remove } = useRules(ownerId);
  const [showModal, setShowModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const used = rules.reduce((sum, rule) => sum + rule.weight, 0);

  function newRuleId(): string {
    return globalThis.crypto.randomUUID();
  }

  async function handleAdd(rule: UpsertRule): Promise<void> {
    if (used + rule.weight > BUDGET_TOTAL) {
      setActionError('This would exceed the 100-point budget.');
      return;
    }
    setActionError(null);
    try {
      await upsert(newRuleId(), rule);
      setShowModal(false);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Could not save the rule.');
    }
  }

  function handleRemove(ruleId: string): void {
    setActionError(null);
    remove(ruleId).catch((caught: unknown) => {
      setActionError(caught instanceof Error ? caught.message : 'Could not delete the rule.');
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Button
          size="sm"
          onClick={() => {
            setShowModal(true);
          }}
        >
          Add rule
        </Button>
      </div>

      <BudgetBar used={used} />
      <ConflictBanner conflicts={conflicts} />

      {actionError !== null && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading rules…</p>}
      {!isLoading && rules.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">No rules yet. Add one to shape your sprint.</p>
      )}

      {rules.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {rule.type}
                  {rule.isHard && (
                    <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                      hard
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  weight {rule.weight} · {JSON.stringify(rule.params)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${rule.type} rule`}
                onClick={() => {
                  handleRemove(rule.id);
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <RuleModal
          onSubmit={(rule) => {
            void handleAdd(rule);
          }}
          onClose={() => {
            setShowModal(false);
          }}
        />
      )}
    </section>
  );
}
