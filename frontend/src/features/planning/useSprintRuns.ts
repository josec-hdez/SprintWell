import { useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { PlanningRun } from '@/features/planning/usePlanningRun';

/**
 * Lists the planning runs of a sprint (issue #88) so two can be compared.
 * No-op (empty) until a sprint id is provided.
 */
export interface SprintRunsState {
  runs: PlanningRun[];
  isLoading: boolean;
  error: string | null;
}

export function useSprintRuns(sprintId: string): SprintRunsState {
  const [state, setState] = useState<SprintRunsState>({
    runs: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (sprintId === '') {
      setState({ runs: [], isLoading: false, error: null });
      return;
    }
    let active = true;
    setState({ runs: [], isLoading: true, error: null });
    api
      .GET('/sprints/{sprintId}/planning-runs', { params: { path: { sprintId } } })
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error !== undefined || data === undefined) {
          setState({ runs: [], isLoading: false, error: 'Could not load the sprint runs.' });
        } else {
          setState({ runs: data, isLoading: false, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setState({ runs: [], isLoading: false, error: 'Could not load the sprint runs.' });
        }
      });
    return () => {
      active = false;
    };
  }, [sprintId]);

  return state;
}
