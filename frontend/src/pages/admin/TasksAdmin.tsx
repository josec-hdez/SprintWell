import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import type { NewTask, TaskStatus } from '@/features/sprint/admin/useSprintTasks';
import { useSprintTasks } from '@/features/sprint/admin/useSprintTasks';
import type { Skill } from '@/features/team/useSkills';
import { cn } from '@/lib/utils';

const INPUT = cn(
  'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);
const CATEGORIES = ['FEATURE', 'BUG', 'INFRA', 'SRE', 'ON_CALL', 'DOCS', 'RESEARCH'] as const;
const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

/** Task management for a single sprint (issue #74). */
export function TasksAdmin({ sprintId, skills }: { sprintId: string; skills: Skill[] }): ReactElement {
  const { tasks, isLoading, error, addTask, removeTask, changeStatus } = useSprintTasks(sprintId);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = (op: Promise<void>): void => {
    setActionError(null);
    op.catch((caught: unknown) => {
      setActionError(caught instanceof Error ? caught.message : 'Something went wrong.');
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-medium">Tasks</h3>

      <AddTaskForm
        skills={skills}
        existingTasks={tasks.map((task) => ({ id: task.id, name: task.name }))}
        onAdd={(task) => run(addTask(task))}
      />

      {actionError !== null && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading tasks…</p>}
      {!isLoading && tasks.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      )}

      {tasks.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Task</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Effort</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t">
                  <td className="px-3 py-2">{task.name}</td>
                  <td className="px-3 py-2">{task.category}</td>
                  <td className="px-3 py-2">{task.effortDays}</td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Status of ${task.name}`}
                      value={task.status}
                      onChange={(e) => run(changeStatus(task.id, e.target.value as TaskStatus))}
                      className={cn(INPUT, 'h-8')}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${task.name}`}
                      onClick={() => run(removeTask(task.id))}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddTaskForm({
  skills,
  existingTasks,
  onAdd,
}: {
  skills: Skill[];
  existingTasks: { id: string; name: string }[];
  onAdd: (task: NewTask) => void;
}): ReactElement {
  const [name, setName] = useState('');
  const [effortDays, setEffortDays] = useState(1);
  const [category, setCategory] = useState<NewTask['category']>('FEATURE');
  const [domain, setDomain] = useState('');
  const [deadlineDay, setDeadlineDay] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [dependsOn, setDependsOn] = useState<string[]>([]);

  function selected(event: { target: HTMLSelectElement }): string[] {
    return Array.from(event.target.selectedOptions, (option) => option.value);
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const task: NewTask = {
      name,
      effortDays,
      category,
      domain,
      requiredSkills,
      dependsOn,
      ...(deadlineDay !== '' ? { deadlineDay: Number(deadlineDay) } : {}),
    };
    onAdd(task);
    setName('');
    setDomain('');
    setDeadlineDay('');
    setRequiredSkills([]);
    setDependsOn([]);
  }

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
      <input
        aria-label="Task name"
        required
        placeholder="Task name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        className={INPUT}
      />
      <input
        aria-label="Domain"
        required
        placeholder="Domain (e.g. auth)"
        value={domain}
        onChange={(e) => {
          setDomain(e.target.value);
        }}
        className={INPUT}
      />
      <label className="flex items-center gap-2 text-sm">
        Effort
        <input
          aria-label="Effort days"
          type="number"
          min={1}
          value={effortDays}
          onChange={(e) => {
            setEffortDays(Number(e.target.value));
          }}
          className={cn(INPUT, 'w-20')}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        Deadline
        <input
          aria-label="Deadline day"
          type="number"
          min={0}
          placeholder="none"
          value={deadlineDay}
          onChange={(e) => {
            setDeadlineDay(e.target.value);
          }}
          className={cn(INPUT, 'w-20')}
        />
      </label>
      <select
        aria-label="Category"
        value={category}
        onChange={(e) => {
          setCategory(e.target.value as NewTask['category']);
        }}
        className={INPUT}
      >
        {CATEGORIES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <div className="grid gap-2 sm:grid-cols-2 sm:col-span-2">
        <label className="text-sm">
          Required skills
          <select
            aria-label="Required skills"
            multiple
            value={requiredSkills}
            onChange={(e) => {
              setRequiredSkills(selected(e));
            }}
            className={cn(INPUT, 'h-24 w-full py-1')}
          >
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Depends on
          <select
            aria-label="Depends on"
            multiple
            value={dependsOn}
            onChange={(e) => {
              setDependsOn(selected(e));
            }}
            className={cn(INPUT, 'h-24 w-full py-1')}
          >
            {existingTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">
          Add task
        </Button>
      </div>
    </form>
  );
}
