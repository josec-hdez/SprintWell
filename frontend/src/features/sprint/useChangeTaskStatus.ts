import { useCallback, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Member action to change one of their own tasks' status (issue #75) via
 * `PATCH /tasks/:id/status`. A 403 (touching someone else's task) surfaces a
 * distinct, readable message.
 */
export type TaskStatus = components['schemas']['ChangeTaskStatusDto']['status'];

export interface UseChangeTaskStatus {
  change: (taskId: string, status: TaskStatus) => Promise<void>;
  isSubmitting: boolean;
}

export function useChangeTaskStatus(): UseChangeTaskStatus {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const change = useCallback(async (taskId: string, status: TaskStatus): Promise<void> => {
    setIsSubmitting(true);
    try {
      // This endpoint only declares 204, so openapi-fetch types `error` as
      // `never`; check the HTTP response directly instead.
      const { response } = await api.PATCH('/tasks/{id}/status', {
        params: { path: { id: taskId } },
        body: { status },
      });
      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? 'You can only change your own tasks.'
            : 'Could not change the task status.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { change, isSubmitting };
}
