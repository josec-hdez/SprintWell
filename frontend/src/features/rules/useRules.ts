import { useCallback, useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Rule management (issues #77, #78). Without `ownerId` it manages the current
 * member's own rules (`/me/rules`, with live conflict detection). With an
 * `ownerId` it manages that member's rules through the admin endpoints
 * (`/admin/members/:ownerId/rules`), reading the public per-member list — the
 * escape hatch that lets an admin unblock someone (brief §4.4).
 */
export type Rule = components['schemas']['RuleResponseDto'];
export type RuleConflict = components['schemas']['RuleConflictResponseDto'];
export type UpsertRule = components['schemas']['UpsertRuleDto'];

export interface UseRules {
  rules: Rule[];
  conflicts: RuleConflict[];
  isLoading: boolean;
  error: string | null;
  upsert: (ruleId: string, rule: UpsertRule) => Promise<void>;
  remove: (ruleId: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useRules(ownerId?: string): UseRules {
  const [rules, setRules] = useState<Rule[]>([]);
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (ownerId !== undefined) {
        const list = await api.GET('/members/{ownerId}/rules', {
          params: { path: { ownerId } },
        });
        if (list.error !== undefined || list.data === undefined) {
          setError('Could not load the member rules.');
          setRules([]);
        } else {
          setError(null);
          setRules(list.data);
        }
        setConflicts([]); // no per-member conflict endpoint; admin edits blind.
      } else {
        const [list, conflictList] = await Promise.all([
          api.GET('/me/rules'),
          api.GET('/me/rules/conflicts'),
        ]);
        if (list.error !== undefined || list.data === undefined) {
          setError('Could not load your rules.');
          setRules([]);
        } else {
          setError(null);
          setRules(list.data);
        }
        setConflicts(conflictList.data ?? []);
      }
    } catch {
      setError('Could not load the rules.');
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upsert = useCallback(
    async (ruleId: string, rule: UpsertRule): Promise<void> => {
      // PUT only declares 204, so `error` is typed `never`; read the response.
      const { response } =
        ownerId !== undefined
          ? await api.PUT('/admin/members/{ownerId}/rules/{ruleId}', {
              params: { path: { ownerId, ruleId } },
              body: rule,
            })
          : await api.PUT('/me/rules/{ruleId}', { params: { path: { ruleId } }, body: rule });
      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? 'That rule conflicts with the budget or another rule.'
            : response.status === 400
              ? 'Invalid rule parameters.'
              : 'Could not save the rule.',
        );
      }
      await reload();
    },
    [ownerId, reload],
  );

  const remove = useCallback(
    async (ruleId: string): Promise<void> => {
      const { response } =
        ownerId !== undefined
          ? await api.DELETE('/admin/members/{ownerId}/rules/{ruleId}', {
              params: { path: { ownerId, ruleId } },
            })
          : await api.DELETE('/me/rules/{ruleId}', { params: { path: { ruleId } } });
      if (!response.ok) {
        throw new Error('Could not delete the rule.');
      }
      await reload();
    },
    [ownerId, reload],
  );

  return { rules, conflicts, isLoading, error, upsert, remove, reload };
}
