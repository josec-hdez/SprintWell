import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { ChevronDown, LogOut } from 'lucide-react';

import { useSession } from '@/auth/session';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * App header (issue #65). Shows the brand, role-conditional navigation, and
 * either a "Login" action (anonymous) or the member's name with a menu.
 */
export function Header(): ReactElement {
  const { user, role, logout } = useSession();
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="text-lg font-semibold">
          SprintWell
        </Link>
        <Nav role={role} />
        {user ? (
          <UserMenu name={user.name} onLogout={logout} />
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

function UserMenu({ name, onLogout }: { name: string; onLogout: () => void }): ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDocClick(event: MouseEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {name}
        <ChevronDown />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-40 rounded-md border bg-background p-1 shadow-md"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
