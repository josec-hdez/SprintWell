import { useCallback, useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Member rule management (issue #77). Loads the member's rules and the
 * backend-detected conflicts, and exposes upsert / delete against the
 * `/me/rules` endpoints, reloading both on success.
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

export function useRules(): UseRules {
  const [rules, setRules] = useState<Rule[]>([]);
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
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
    } catch {
      setError('Could not load your rules.');
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upsert = useCallback(
    async (ruleId: string, rule: UpsertRule): Promise<void> => {
      // PUT only declares 204, so `error` is typed `never`; read the response.
      const { response } = await api.PUT('/me/rules/{ruleId}', {
        params: { path: { ruleId } },
        body: rule,
      });
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
    [reload],
  );

  const remove = useCallback(
    async (ruleId: string): Promise<void> => {
      const { response } = await api.DELETE('/me/rules/{ruleId}', {
        params: { path: { ruleId } },
      });
      if (!response.ok) {
        throw new Error('Could not delete the rule.');
      }
      await reload();
    },
    [reload],
  );

  return { rules, conflicts, isLoading, error, upsert, remove, reload };
}
