import { useCallback, useEffect, useState } from 'react';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Admin skill-catalog management (issue #73). Loads the skills and exposes
 * create / delete mutations that reload the list on success.
 */
export type Skill = components['schemas']['SkillResponseDto'];

export interface UseSkills {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  createSkill: (name: string) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useSkills(): UseSkills {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error: err } = await api.GET('/admin/skills');
      if (err !== undefined || data === undefined) {
        setError('Could not load skills.');
        setSkills([]);
      } else {
        setError(null);
        setSkills(data);
      }
    } catch {
      setError('Could not load skills.');
      setSkills([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createSkill = useCallback(
    async (name: string): Promise<void> => {
      const { error: err } = await api.POST('/admin/skills', { body: { name } });
      if (err !== undefined) {
        throw new Error('Could not create skill.');
      }
      await reload();
    },
    [reload],
  );

  const deleteSkill = useCallback(
    async (id: string): Promise<void> => {
      const { error: err } = await api.DELETE('/admin/skills/{id}', {
        params: { path: { id } },
      });
      if (err !== undefined) {
        throw new Error('Could not delete skill.');
      }
      await reload();
    },
    [reload],
  );

  return { skills, isLoading, error, createSkill, deleteSkill, reload };
}
