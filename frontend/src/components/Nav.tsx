import type { ReactElement } from 'react';
import { NavLink } from 'react-router';

import type { Role } from '@/auth/session';
import { cn } from '@/lib/utils';

/**
 * Role-conditional primary navigation (issue #65, brief §4.4). Each role sees a
 * different set of destinations; the target routes are filled in by later
 * frontend issues (#71–#88).
 */

interface NavItem {
  label: string;
  to: string;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  anonymous: [{ label: 'Sprints', to: '/' }],
  member: [
    { label: 'Sprints', to: '/' },
    { label: 'My tasks', to: '/my-tasks' },
    { label: 'My rules', to: '/my-rules' },
  ],
  admin: [
    { label: 'Sprints', to: '/' },
    { label: 'Team', to: '/admin/team' },
    { label: 'Backlog', to: '/admin/sprints' },
    { label: 'Rules', to: '/admin/member-rules' },
    { label: 'Compare', to: '/compare' },
  ],
};

export function Nav({ role }: { role: Role }): ReactElement {
  const items = NAV_BY_ROLE[role];
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent text-accent-foreground',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
