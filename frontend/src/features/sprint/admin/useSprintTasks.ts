import { useCallback, useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import type { Sprint } from '@/features/sprint/useSprintList';

/**
 * Admin task management within a sprint (issue #74). Loads the sprint (and its
 * tasks) via the public detail read and exposes add / remove / change-status
 * mutations against the AdminGuard-protected endpoints, reloading on success.
 */
export type Task = Sprint['tasks'][number];
export type NewTask = components['schemas']['AddTaskDto'];
export type TaskStatus = components['schemas']['ChangeTaskStatusDto']['status'];

export interface UseSprintTasks {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  addTask: (task: NewTask) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  changeStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export function useSprintTasks(sprintId: string): UseSprintTasks {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error: err } = await api.GET('/sprints/{id}', {
        params: { path: { id: sprintId } },
      });
      if (err !== undefined || data === undefined) {
        setError('Could not load tasks.');
        setTasks([]);
      } else {
        setError(null);
        setTasks(data.tasks);
      }
    } catch {
      setError('Could not load tasks.');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addTask = useCallback(
    async (task: NewTask): Promise<void> => {
      const { error: err } = await api.POST('/admin/sprints/{id}/tasks', {
        params: { path: { id: sprintId } },
        body: task,
      });
      if (err !== undefined) {
        throw new Error('Could not add task.');
      }
      await reload();
    },
    [sprintId, reload],
  );

  const removeTask = useCallback(
    async (taskId: string): Promise<void> => {
      const { error: err } = await api.DELETE('/admin/sprints/{id}/tasks/{taskId}', {
        params: { path: { id: sprintId, taskId } },
      });
      if (err !== undefined) {
        throw new Error('Could not remove task.');
      }
      await reload();
    },
    [sprintId, reload],
  );

  const changeStatus = useCallback(
    async (taskId: string, status: TaskStatus): Promise<void> => {
      const { error: err } = await api.PATCH('/admin/sprints/{id}/tasks/{taskId}/status', {
        params: { path: { id: sprintId, taskId } },
        body: { status },
      });
      if (err !== undefined) {
        throw new Error('Could not change status.');
      }
      await reload();
    },
    [sprintId, reload],
  );

  return { tasks, isLoading, error, addTask, removeTask, changeStatus };
}
