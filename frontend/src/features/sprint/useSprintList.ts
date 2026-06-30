import { useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Loads the public sprint listing (issue #71). No auth required (brief §4.4).
 * Exposes the three states the screen renders: loading, error and the data
 * (which may be empty).
 */
export type Sprint = components['schemas']['SprintResponseDto'];

export interface SprintListState {
  sprints: Sprint[];
  isLoading: boolean;
  error: string | null;
}

export function useSprintList(): SprintListState {
  const [state, setState] = useState<SprintListState>({
    sprints: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const fail = (): void => {
      if (active) {
        setState({ sprints: [], isLoading: false, error: 'Could not load sprints.' });
      }
    };

    api
      .GET('/sprints')
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error !== undefined || data === undefined) {
          fail();
          return;
        }
        setState({ sprints: data, isLoading: false, error: null });
      })
      .catch(fail);

    return () => {
      active = false;
    };
  }, []);

  return state;
}
