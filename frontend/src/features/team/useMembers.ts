import { useCallback, useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Admin member management (issue #73). Loads the member list and exposes
 * create / delete / assign-skill mutations, each reloading the list on success.
 * All calls hit the AdminGuard-protected endpoints; the bearer token is injected
 * by the auth store middleware.
 */
export type Member = components['schemas']['MemberResponseDto'];
export type NewMember = components['schemas']['CreateMemberDto'];

export interface UseMembers {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  createMember: (member: NewMember) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  assignSkill: (id: string, skillId: string, level: number) => Promise<void>;
  reload: () => Promise<void>;
}

export function useMembers(): UseMembers {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error: err } = await api.GET('/admin/members');
      if (err !== undefined || data === undefined) {
        setError('Could not load members.');
        setMembers([]);
      } else {
        setError(null);
        setMembers(data);
      }
    } catch {
      setError('Could not load members.');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createMember = useCallback(
    async (member: NewMember): Promise<void> => {
      const { error: err } = await api.POST('/admin/members', { body: member });
      if (err !== undefined) {
        throw new Error('Could not create member.');
      }
      await reload();
    },
    [reload],
  );

  const deleteMember = useCallback(
    async (id: string): Promise<void> => {
      const { error: err } = await api.DELETE('/admin/members/{id}', {
        params: { path: { id } },
      });
      if (err !== undefined) {
        throw new Error('Could not delete member.');
      }
      await reload();
    },
    [reload],
  );

  const assignSkill = useCallback(
    async (id: string, skillId: string, level: number): Promise<void> => {
      const { error: err } = await api.POST('/admin/members/{id}/skills', {
        params: { path: { id } },
        body: { skillId, level },
      });
      if (err !== undefined) {
        throw new Error('Could not assign skill.');
      }
    },
    [],
  );

  return { members, isLoading, error, createMember, deleteMember, assignSkill, reload };
}
