import { useCallback, useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Loads the authenticated member's assigned tasks (issue #75) from
 * `GET /me/tasks`. Exposes loading, error, the tasks and a reload.
 */
export type MyTask = components['schemas']['MyTaskResponseDto'];

export interface UseMyTasks {
  tasks: MyTask[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useMyTasks(): UseMyTasks {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error: err } = await api.GET('/me/tasks');
      if (err !== undefined || data === undefined) {
        setError('Could not load your tasks.');
        setTasks([]);
      } else {
        setError(null);
        setTasks(data);
      }
    } catch {
      setError('Could not load your tasks.');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tasks, isLoading, error, reload };
}
