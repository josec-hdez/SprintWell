import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAuthStore } from '@/stores/auth.store';
import type { Credentials } from '@/stores/auth.store';

/**
 * Login form controller (issue #69). Wraps the auth store's `login` with the
 * submit lifecycle the screen needs: a loading flag, a readable error message,
 * and a redirect to the home page on success. Invalid credentials and a
 * server/network failure surface as distinct messages.
 */
export interface UseLogin {
  submit: (credentials: Credentials) => Promise<void>;
  error: string | null;
  isSubmitting: boolean;
}

export function useLogin(): UseLogin {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (credentials: Credentials): Promise<void> => {
      setError(null);
      setIsSubmitting(true);
      try {
        await login(credentials);
        navigate('/');
      } catch (caught) {
        const invalid = caught instanceof Error && /invalid/i.test(caught.message);
        setError(
          invalid
            ? 'Invalid email or password.'
            : 'Could not reach the server. Please try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, navigate],
  );

  return { submit, error, isSubmitting };
}
