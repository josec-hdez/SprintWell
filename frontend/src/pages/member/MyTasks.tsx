import { useState } from 'react';
import type { ReactElement } from 'react';

import { useChangeTaskStatus } from '@/features/sprint/useChangeTaskStatus';
import type { TaskStatus } from '@/features/sprint/useChangeTaskStatus';
import { useMyTasks } from '@/features/sprint/useMyTasks';
import { cn } from '@/lib/utils';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];
const SELECT = cn(
  'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);

/**
 * "My tasks" (issue #75): the authenticated member's assigned tasks with a
 * status changer. Changing the status asks for confirmation, then calls
 * `PATCH /tasks/:id/status`, reloading on success and surfacing errors (incl.
 * 403 when touching a task that is not theirs).
 */
export function MyTasks(): ReactElement {
  const { tasks, isLoading, error, reload } = useMyTasks();
  const { change } = useChangeTaskStatus();
  const [actionError, setActionError] = useState<string | null>(null);

  async function onChangeStatus(
    taskId: string,
    taskName: string,
    status: TaskStatus,
  ): Promise<void> {
    if (!window.confirm(`Change "${taskName}" to ${status}?`)) {
      return;
    }
    setActionError(null);
    try {
      await change(taskId, status);
      await reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Something went wrong.');
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">My tasks</h1>

      {actionError !== null && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading your tasks…</p>}
      {!isLoading && tasks.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">You have no assigned tasks.</p>
      )}

      {tasks.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Task</th>
                <th className="px-3 py-2 font-medium">Sprint</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.taskId} className="border-t">
                  <td className="px-3 py-2">{task.taskName}</td>
                  <td className="px-3 py-2">{task.sprintName}</td>
                  <td className="px-3 py-2">{task.category}</td>
                  <td className="px-3 py-2">Day {task.startDay}</td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Status of ${task.taskName}`}
                      value={task.status}
                      onChange={(event) => {
                        void onChangeStatus(
                          task.taskId,
                          task.taskName,
                          event.target.value as TaskStatus,
                        );
                      }}
                      className={SELECT}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
