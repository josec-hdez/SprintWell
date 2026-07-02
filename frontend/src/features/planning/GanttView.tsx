import type { ReactElement } from 'react';

import type { PlanningRun, Sprint } from '@/features/planning/usePlanningRun';
import { cn } from '@/lib/utils';

type Task = Sprint['tasks'][number];

const STATUS_COLOR: Record<string, string> = {
  TODO: 'bg-muted text-foreground',
  IN_PROGRESS: 'bg-blue-500 text-white',
  DONE: 'bg-green-600 text-white',
  BLOCKED: 'bg-destructive text-white',
};

/**
 * Gantt / calendar view (issue #81): assignments laid out per user × day, each
 * task bar colored by its status. Task bars auto-stack within a user's row so
 * overlaps stay readable. Native tooltips summarize each task.
 */
export function GanttView({ run, sprint }: { run: PlanningRun; sprint: Sprint }): ReactElement {
  const days = sprint.durationDays;
  const tasksById = new Map<string, Task>(sprint.tasks.map((task) => [task.id, task]));
  const users = [...new Set(run.assignments.map((a) => a.userId))].sort((a, b) =>
    a.localeCompare(b),
  );
  const dayColumns = `10rem repeat(${String(days)}, minmax(2rem, 1fr))`;

  return (
    <div className="space-y-3">
      <Legend />
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[40rem]">
          {/* Header: day numbers */}
          <div className="grid border-b bg-muted/50 text-xs" style={{ gridTemplateColumns: dayColumns }}>
            <div className="px-3 py-2 font-medium">Member</div>
            {Array.from({ length: days }, (_, day) => (
              <div key={day} className="border-l px-1 py-2 text-center text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {users.map((userId) => {
            const assignments = run.assignments.filter((a) => a.userId === userId);
            return (
              <div
                key={userId}
                className="grid border-b last:border-b-0"
                style={{ gridTemplateColumns: dayColumns }}
              >
                <div className="truncate px-3 py-2 text-sm font-medium">{userId}</div>
                <div
                  className="relative col-start-2 -col-end-1 grid gap-1 p-1"
                  style={{ gridTemplateColumns: `repeat(${String(days)}, minmax(2rem, 1fr))` }}
                >
                  {assignments.map((assignment) => {
                    const task = tasksById.get(assignment.taskId);
                    const effort = task?.effortDays ?? 1;
                    const status = task?.status ?? 'TODO';
                    const end = assignment.startDay + effort;
                    return (
                      <div
                        key={assignment.taskId}
                        title={`${task?.name ?? assignment.taskId} · ${task?.category ?? ''} · ${status} · days ${String(assignment.startDay)}–${String(end - 1)}`}
                        className={cn(
                          'truncate rounded px-2 py-1 text-xs',
                          STATUS_COLOR[status] ?? STATUS_COLOR.TODO,
                        )}
                        style={{ gridColumn: `${String(assignment.startDay + 1)} / span ${String(effort)}` }}
                      >
                        {task?.name ?? assignment.taskId}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend(): ReactElement {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {Object.entries(STATUS_COLOR).map(([status, color]) => (
        <span key={status} className="flex items-center gap-1">
          <span className={cn('inline-block h-3 w-3 rounded', color)} />
          {status}
        </span>
      ))}
    </div>
  );
}
