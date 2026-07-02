import { useState } from 'react';
import type { ReactElement } from 'react';

import { useMembers } from '@/features/team/useMembers';
import { RuleEditor } from '@/pages/member/RuleEditor';
import { cn } from '@/lib/utils';

const SELECT = cn(
  'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);

/**
 * Admin view to edit any member's rules (issue #78, brief §4.4): pick a member,
 * then reuse the rule editor against the admin endpoints. Behind RequireAdmin.
 */
export function MemberRulesAdmin(): ReactElement {
  const { members, isLoading, error } = useMembers();
  const [selectedId, setSelectedId] = useState('');
  const selected = members.find((member) => member.id === selectedId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Member rules</h1>

      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading members…</p>}

      <label className="block max-w-sm text-sm">
        Member
        <select
          aria-label="Member"
          value={selectedId}
          onChange={(event) => {
            setSelectedId(event.target.value);
          }}
          className={cn(SELECT, 'w-full')}
        >
          <option value="">Select a member…</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>
      </label>

      {selected !== undefined && (
        <RuleEditor
          key={selected.id}
          ownerId={selected.id}
          title={`Rules for ${selected.name}`}
        />
      )}
    </div>
  );
}
