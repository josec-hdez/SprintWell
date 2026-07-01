import { useCallback, useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import type { Sprint } from '@/features/sprint/useSprintList';

/**
 * Admin sprint management (issue #74). Lists sprints via the public read and
 * exposes create / delete against the AdminGuard-protected endpoints.
 */
export type NewSprint = components['schemas']['CreateSprintDto'];

export interface UseSprintsAdmin {
  sprints: Sprint[];
  isLoading: boolean;
  error: string | null;
  createSprint: (sprint: NewSprint) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useSprintsAdmin(): UseSprintsAdmin {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error: err } = await api.GET('/sprints');
      if (err !== undefined || data === undefined) {
        setError('Could not load sprints.');
        setSprints([]);
      } else {
        setError(null);
        setSprints(data);
      }
    } catch {
      setError('Could not load sprints.');
      setSprints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createSprint = useCallback(
    async (sprint: NewSprint): Promise<void> => {
      const { error: err } = await api.POST('/admin/sprints', { body: sprint });
      if (err !== undefined) {
        throw new Error('Could not create sprint.');
      }
      await reload();
    },
    [reload],
  );

  const deleteSprint = useCallback(
    async (id: string): Promise<void> => {
      const { error: err } = await api.DELETE('/admin/sprints/{id}', {
        params: { path: { id } },
      });
      if (err !== undefined) {
        throw new Error('Could not delete sprint.');
      }
      await reload();
    },
    [reload],
  );

  return { sprints, isLoading, error, createSprint, deleteSprint, reload };
}
