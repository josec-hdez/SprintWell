import { useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { Sprint } from '@/features/sprint/useSprintList';

/**
 * Loads a single sprint with its tasks (issue #72) from the public
 * `GET /sprints/:id` endpoint. Exposes loading, error and the sprint.
 */
export interface SprintDetailState {
  sprint: Sprint | null;
  isLoading: boolean;
  error: string | null;
}

export function useSprintDetail(id: string): SprintDetailState {
  const [state, setState] = useState<SprintDetailState>({
    sprint: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const fail = (): void => {
      if (active) {
        setState({ sprint: null, isLoading: false, error: 'Sprint not found or unavailable.' });
      }
    };

    api
      .GET('/sprints/{id}', { params: { path: { id } } })
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error !== undefined || data === undefined) {
          fail();
          return;
        }
        setState({ sprint: data, isLoading: false, error: null });
      })
      .catch(fail);

    return () => {
      active = false;
    };
  }, [id]);

  return state;
}
