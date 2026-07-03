import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { LaunchPlanningModal } from '@/features/planning/LaunchPlanningModal';
import type { NewSprint } from '@/features/sprint/admin/useSprintsAdmin';
import { useSprintsAdmin } from '@/features/sprint/admin/useSprintsAdmin';
import { useSkills } from '@/features/team/useSkills';
import { TasksAdmin } from '@/pages/admin/TasksAdmin';
import { cn } from '@/lib/utils';

const INPUT = cn(
  'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);

/** Admin sprint + task management (issue #74). Behind RequireAdmin at /admin/sprints. */
export function SprintsAdmin(): ReactElement {
  const { sprints, isLoading, error, createSprint, deleteSprint } = useSprintsAdmin();
  const { skills } = useSkills();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [planningSprint, setPlanningSprint] = useState<{ id: string; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = (op: Promise<void>): void => {
    setActionError(null);
    op.catch((caught: unknown) => {
      setActionError(caught instanceof Error ? caught.message : 'Something went wrong.');
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sprint administration</h1>

      <CreateSprintForm onCreate={(sprint) => run(createSprint(sprint))} />

      {actionError !== null && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <Loading label="Loading sprints…" />}
      {!isLoading && sprints.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">No sprints yet.</p>
      )}

      <ul className="space-y-2">
        {sprints.map((sprint) => (
          <li key={sprint.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{sprint.name}</p>
                <p className="text-sm text-muted-foreground">
                  {sprint.startDate} · {sprint.durationDays} days · {sprint.tasks.length} tasks
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setPlanningSprint({ id: sprint.id, name: sprint.name });
                  }}
                >
                  <Play />
                  Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedId((current) => (current === sprint.id ? null : sprint.id));
                  }}
                >
                  {selectedId === sprint.id ? 'Hide tasks' : 'Manage tasks'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${sprint.name}`}
                  onClick={() => run(deleteSprint(sprint.id))}
                >
                  Delete
                </Button>
              </div>
            </div>
            {selectedId === sprint.id && (
              <div className="mt-3">
                <TasksAdmin sprintId={sprint.id} skills={skills} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {planningSprint !== null && (
        <LaunchPlanningModal
          sprintId={planningSprint.id}
          sprintName={planningSprint.name}
          onClose={() => {
            setPlanningSprint(null);
          }}
        />
      )}
    </div>
  );
}

function CreateSprintForm({ onCreate }: { onCreate: (sprint: NewSprint) => void }): ReactElement {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationDays, setDurationDays] = useState(14);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onCreate({ name, startDate, durationDays });
    setName('');
    setStartDate('');
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <input
        aria-label="Sprint name"
        required
        placeholder="Sprint name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        className={INPUT}
      />
      <input
        aria-label="Start date"
        type="date"
        required
        value={startDate}
        onChange={(e) => {
          setStartDate(e.target.value);
        }}
        className={INPUT}
      />
      <label className="flex items-center gap-2 text-sm">
        Days
        <input
          aria-label="Duration days"
          type="number"
          min={1}
          value={durationDays}
          onChange={(e) => {
            setDurationDays(Number(e.target.value));
          }}
          className={cn(INPUT, 'w-20')}
        />
      </label>
      <Button type="submit" size="sm">
        Create sprint
      </Button>
    </form>
  );
}
