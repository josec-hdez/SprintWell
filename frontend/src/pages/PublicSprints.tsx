import { useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { useSprintList } from '@/features/sprint/useSprintList';
import type { Sprint } from '@/features/sprint/useSprintList';

const PAGE_SIZE = 10;

/**
 * Public sprint listing (issue #71). Readable without a login (brief §4.4):
 * shows loading, error and empty states, and pages the list client-side with a
 * "Load more" control.
 */
export function PublicSprints(): ReactElement {
  const { sprints, isLoading, error } = useSprintList();
  const [visible, setVisible] = useState(PAGE_SIZE);

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">Sprints</h1>

      {isLoading && <p className="text-muted-foreground">Loading sprints…</p>}

      {error !== null && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      {!isLoading && error === null && sprints.length === 0 && (
        <p className="text-muted-foreground">No sprints yet.</p>
      )}

      {sprints.length > 0 && (
        <>
          <ul className="space-y-3">
            {sprints.slice(0, visible).map((sprint) => (
              <li key={sprint.id}>
                <SprintCard sprint={sprint} />
              </li>
            ))}
          </ul>

          {visible < sprints.length && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setVisible((current) => current + PAGE_SIZE);
                }}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SprintCard({ sprint }: { sprint: Sprint }): ReactElement {
  const taskCount = sprint.tasks.length;
  return (
    <Link
      to={`/sprints/${sprint.id}`}
      className="block rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
    >
      <h2 className="font-medium">{sprint.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Starts {sprint.startDate} · {sprint.durationDays} days · {taskCount}{' '}
        {taskCount === 1 ? 'task' : 'tasks'}
      </p>
    </Link>
  );
}
