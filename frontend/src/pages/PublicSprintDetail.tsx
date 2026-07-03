import type { ReactElement, ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { Loading } from '@/components/ui/loading';
import { useSprintDetail } from '@/features/sprint/useSprintDetail';
import type { Sprint } from '@/features/sprint/useSprintList';

type Task = Sprint['tasks'][number];

/**
 * Public sprint detail (issue #72): the sprint's metadata plus a table of its
 * tasks (brief §5.2 fields). Handles loading, error and empty-tasks states. No
 * auth required.
 */
export function PublicSprintDetail(): ReactElement {
  const { id = '' } = useParams();
  const { sprint, isLoading, error } = useSprintDetail(id);

  if (isLoading) {
    return <Loading label="Loading sprint…" />;
  }

  if (error !== null || sprint === null) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">
          {error ?? 'Sprint not found or unavailable.'}
        </p>
        <BackLink />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <BackLink />
        <h1 className="mt-2 text-2xl font-semibold">{sprint.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Starts {sprint.startDate} · {sprint.durationDays} days · {sprint.tasks.length}{' '}
          {sprint.tasks.length === 1 ? 'task' : 'tasks'}
        </p>
      </div>

      {sprint.tasks.length === 0 ? (
        <p className="text-muted-foreground">No tasks in this sprint.</p>
      ) : (
        <TaskTable tasks={sprint.tasks} />
      )}
    </section>
  );
}

function TaskTable({ tasks }: { tasks: Task[] }): ReactElement {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <Th>Task</Th>
            <Th>Category</Th>
            <Th>Domain</Th>
            <Th>Effort</Th>
            <Th>Deadline</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t">
              <Td>{task.name}</Td>
              <Td>{task.category}</Td>
              <Td>{task.domain}</Td>
              <Td>
                {task.effortDays} {task.effortDays === 1 ? 'day' : 'days'}
              </Td>
              <Td>{task.deadlineDay === null ? '—' : `Day ${task.deadlineDay}`}</Td>
              <Td>{task.status}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: string }): ReactElement {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

function Td({ children }: { children: ReactNode }): ReactElement {
  return <td className="px-3 py-2">{children}</td>;
}

function BackLink(): ReactElement {
  return (
    <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
      ← All sprints
    </Link>
  );
}
