import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import type { Skill } from '@/features/team/useSkills';
import { cn } from '@/lib/utils';

const INPUT = cn(
  'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);

export interface SkillsAdminProps {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  createSkill: (name: string) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
}

/** Admin skill-catalog table with create and delete (issue #73). */
export function SkillsAdmin(props: SkillsAdminProps): ReactElement {
  const { skills, isLoading, error, createSkill, deleteSkill } = props;
  const [name, setName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const run = (op: Promise<void>): void => {
    setActionError(null);
    op.catch((caught: unknown) => {
      setActionError(caught instanceof Error ? caught.message : 'Something went wrong.');
    });
  };

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (name.trim() !== '') {
      run(createSkill(name.trim()));
      setName('');
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Skills</h2>

      <form onSubmit={submit} className="flex items-end gap-2">
        <input
          aria-label="Skill name"
          required
          placeholder="Skill name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          className={INPUT}
        />
        <Button type="submit" size="sm">
          Add skill
        </Button>
      </form>

      {actionError !== null && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading skills…</p>}

      {!isLoading && skills.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">No skills yet.</p>
      )}

      {skills.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {skills.map((skill) => (
            <li key={skill.id} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm">{skill.name}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${skill.name}`}
                onClick={() => run(deleteSkill(skill.id))}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
