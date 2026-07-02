import { useCallback } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Launches a planning run for a sprint (issue #79) via the AdminGuard-protected
 * endpoint. The solver runs server-side, so the call blocks until it finishes;
 * the returned run carries the status (which may be INFEASIBLE).
 */
export type PlanningRun = components['schemas']['PlanningRunResponseDto'];
export type LaunchOptions = components['schemas']['LaunchPlanningDto'];

export interface UseLaunchPlanning {
  launch: (sprintId: string, options: LaunchOptions) => Promise<PlanningRun>;
}

export function useLaunchPlanning(): UseLaunchPlanning {
  const launch = useCallback(
    async (sprintId: string, options: LaunchOptions): Promise<PlanningRun> => {
      // Only a 200 is declared, so openapi-fetch types `error` as `never`;
      // check the HTTP response directly.
      const { data, response } = await api.POST('/admin/sprints/{sprintId}/planning-runs', {
        params: { path: { sprintId } },
        body: options,
      });
      if (!response.ok || data === undefined) {
        throw new Error(
          response.status === 503
            ? 'The optimizer service is unavailable. Please try again.'
            : 'Could not launch the planning run.',
        );
      }
      return data;
    },
    [],
  );

  return { launch };
}
