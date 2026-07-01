import type { ReactElement } from 'react';

import { useMembers } from '@/features/team/useMembers';
import { useSkills } from '@/features/team/useSkills';
import { MembersAdmin } from '@/pages/admin/MembersAdmin';
import { SkillsAdmin } from '@/pages/admin/SkillsAdmin';

/**
 * Team administration page (issue #73): wires the member and skill hooks to the
 * two management panels. Rendered behind RequireAdmin at /admin/team.
 */
export function TeamAdmin(): ReactElement {
  const members = useMembers();
  const skills = useSkills();

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">Team administration</h1>
      <MembersAdmin
        members={members.members}
        skills={skills.skills}
        isLoading={members.isLoading}
        error={members.error}
        createMember={members.createMember}
        deleteMember={members.deleteMember}
        assignSkill={members.assignSkill}
      />
      <SkillsAdmin
        skills={skills.skills}
        isLoading={skills.isLoading}
        error={skills.error}
        createSkill={skills.createSkill}
        deleteSkill={skills.deleteSkill}
      />
    </div>
  );
}
