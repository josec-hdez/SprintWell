import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { useLogin } from '@/features/auth/useLogin';
import { cn } from '@/lib/utils';

/**
 * Login screen (issue #69). A minimal email/password form wired to the auth
 * store via `useLogin`: a valid login persists the JWT and redirects home,
 * invalid credentials and server errors render an inline message.
 */
export function Login(): ReactElement {
  const { submit, error, isSubmitting } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit({ email, password });
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="email" label="Email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            className={inputClass}
          />
        </Field>

        <Field id="password" label="Password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            className={inputClass}
          />
        </Field>

        {error !== null && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}

const inputClass = cn(
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'transition-colors placeholder:text-muted-foreground focus-visible:outline-none',
  'focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
);

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactElement;
}): ReactElement {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
