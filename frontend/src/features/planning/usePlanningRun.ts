import { useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Loads a planning run and its sprint (issues #81, #82). The run carries the
 * assignments; the sprint supplies task names/effort and the horizon needed to
 * lay them out. Exposes loading, error and both entities.
 */
export type PlanningRun = components['schemas']['PlanningRunResponseDto'];
export type Sprint = components['schemas']['SprintResponseDto'];

export interface PlanningRunState {
  run: PlanningRun | null;
  sprint: Sprint | null;
  isLoading: boolean;
  error: string | null;
}

export function usePlanningRun(id: string): PlanningRunState {
  const [state, setState] = useState<PlanningRunState>({
    run: null,
    sprint: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const fail = (): void => {
      if (active) {
        setState({ run: null, sprint: null, isLoading: false, error: 'Could not load the plan.' });
      }
    };

    async function load(): Promise<void> {
      const runResult = await api.GET('/planning-runs/{id}', { params: { path: { id } } });
      if (!active) {
        return;
      }
      if (runResult.error !== undefined || runResult.data === undefined) {
        fail();
        return;
      }
      const run = runResult.data;
      const sprintResult = await api.GET('/sprints/{id}', {
        params: { path: { id: run.sprintId } },
      });
      if (!active) {
        return;
      }
      setState({
        run,
        sprint: sprintResult.data ?? null,
        isLoading: false,
        error: null,
      });
    }

    load().catch(fail);
    return () => {
      active = false;
    };
  }, [id]);

  return state;
}
