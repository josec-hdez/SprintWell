import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import type { Member, NewMember } from '@/features/team/useMembers';
import type { Skill } from '@/features/team/useSkills';
import { cn } from '@/lib/utils';

const INPUT = cn(
  'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);
const PAGE_SIZE = 10;

export interface MembersAdminProps {
  members: Member[];
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  createMember: (member: NewMember) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  assignSkill: (id: string, skillId: string, level: number) => Promise<void>;
}

/** Admin members table with create, delete and skill assignment (issue #73). */
export function MembersAdmin(props: MembersAdminProps): ReactElement {
  const { members, skills, isLoading, error, createMember, deleteMember, assignSkill } = props;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = (op: Promise<void>): void => {
    setActionError(null);
    op.catch((caught: unknown) => {
      setActionError(caught instanceof Error ? caught.message : 'Something went wrong.');
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Members</h2>

      <CreateMemberForm onCreate={(member) => run(createMember(member))} />

      {actionError !== null && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading members…</p>}

      {!isLoading && members.length === 0 && error === null && (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      )}

      {members.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Skill</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {members.slice(0, visible).map((member) => (
                  <tr key={member.id} className="border-t align-top">
                    <td className="px-3 py-2">{member.email}</td>
                    <td className="px-3 py-2">{member.name}</td>
                    <td className="px-3 py-2">{member.role}</td>
                    <td className="px-3 py-2">
                      <AssignSkillForm
                        skills={skills}
                        onAssign={(skillId, level) => run(assignSkill(member.id, skillId, level))}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${member.name}`}
                        onClick={() => run(deleteMember(member.id))}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible < members.length && (
            <Button
              variant="outline"
              onClick={() => {
                setVisible((current) => current + PAGE_SIZE);
              }}
            >
              Load more
            </Button>
          )}
        </>
      )}
    </section>
  );
}

function CreateMemberForm({ onCreate }: { onCreate: (member: NewMember) => void }): ReactElement {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<NewMember['role']>('MEMBER');
  const [initialPassword, setInitialPassword] = useState('');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onCreate({ email, name, role, initialPassword });
    setEmail('');
    setName('');
    setInitialPassword('');
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <input
        aria-label="Email"
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        className={INPUT}
      />
      <input
        aria-label="Name"
        required
        placeholder="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        className={INPUT}
      />
      <select
        aria-label="Role"
        value={role}
        onChange={(e) => {
          setRole(e.target.value as NewMember['role']);
        }}
        className={INPUT}
      >
        <option value="MEMBER">Member</option>
        <option value="ADMIN">Admin</option>
      </select>
      <input
        aria-label="Initial password"
        type="password"
        required
        placeholder="Initial password"
        value={initialPassword}
        onChange={(e) => {
          setInitialPassword(e.target.value);
        }}
        className={INPUT}
      />
      <Button type="submit" size="sm">
        Add member
      </Button>
    </form>
  );
}

function AssignSkillForm({
  skills,
  onAssign,
}: {
  skills: Skill[];
  onAssign: (skillId: string, level: number) => void;
}): ReactElement {
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState(3);

  if (skills.length === 0) {
    return <span className="text-xs text-muted-foreground">No skills</span>;
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (skillId !== '') {
      onAssign(skillId, level);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <select
        aria-label="Skill"
        value={skillId}
        onChange={(e) => {
          setSkillId(e.target.value);
        }}
        className={cn(INPUT, 'h-8')}
      >
        <option value="">Skill…</option>
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.name}
          </option>
        ))}
      </select>
      <input
        aria-label="Level"
        type="number"
        min={1}
        max={5}
        value={level}
        onChange={(e) => {
          setLevel(Number(e.target.value));
        }}
        className={cn(INPUT, 'h-8 w-16')}
      />
      <Button type="submit" variant="outline" size="sm" disabled={skillId === ''}>
        Assign
      </Button>
    </form>
  );
}
