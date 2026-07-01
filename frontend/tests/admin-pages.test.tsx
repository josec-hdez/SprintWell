import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { MembersAdmin } from '@/pages/admin/MembersAdmin';
import { SkillsAdmin } from '@/pages/admin/SkillsAdmin';
import { RequireAdmin } from '@/components/RequireAdmin';
import { useAuthStore } from '@/stores/auth.store';

const noop = (): Promise<void> => Promise.resolve();
const member = { id: 'u1', email: 'a@x.com', name: 'Ana', role: 'MEMBER' };
const skill = { id: 's1', name: 'backend' };

describe('MembersAdmin', () => {
  it('renders members and submits the create form', () => {
    const createMember = vi.fn(noop);
    render(
      <MembersAdmin
        members={[member]}
        skills={[skill]}
        isLoading={false}
        error={null}
        createMember={createMember}
        deleteMember={vi.fn(noop)}
        assignSkill={vi.fn(noop)}
      />,
    );

    expect(screen.getByText('a@x.com')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@x.com' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText('Initial password'), { target: { value: 'pw123456' } });
    fireEvent.click(screen.getByRole('button', { name: /add member/i }));

    expect(createMember).toHaveBeenCalledWith({
      email: 'new@x.com',
      name: 'New',
      role: 'MEMBER',
      initialPassword: 'pw123456',
    });
  });

  it('deletes a member and assigns a skill', () => {
    const deleteMember = vi.fn(noop);
    const assignSkill = vi.fn(noop);
    render(
      <MembersAdmin
        members={[member]}
        skills={[skill]}
        isLoading={false}
        error={null}
        createMember={vi.fn(noop)}
        deleteMember={deleteMember}
        assignSkill={assignSkill}
      />,
    );

    fireEvent.change(screen.getByLabelText('Skill'), { target: { value: 's1' } });
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /assign/i }));
    expect(assignSkill).toHaveBeenCalledWith('u1', 's1', 4);

    fireEvent.click(screen.getByRole('button', { name: /delete ana/i }));
    expect(deleteMember).toHaveBeenCalledWith('u1');
  });
});

describe('SkillsAdmin', () => {
  it('creates and deletes skills', () => {
    const createSkill = vi.fn(noop);
    const deleteSkill = vi.fn(noop);
    render(
      <SkillsAdmin
        skills={[skill]}
        isLoading={false}
        error={null}
        createSkill={createSkill}
        deleteSkill={deleteSkill}
      />,
    );

    fireEvent.change(screen.getByLabelText('Skill name'), { target: { value: 'devops' } });
    fireEvent.click(screen.getByRole('button', { name: /add skill/i }));
    expect(createSkill).toHaveBeenCalledWith('devops');

    fireEvent.click(screen.getByRole('button', { name: /delete backend/i }));
    expect(deleteSkill).toHaveBeenCalledWith('s1');
  });
});

describe('RequireAdmin', () => {
  function renderGuardedAt(): void {
    const router = createMemoryRouter(
      [
        { path: '/admin', element: <RequireAdmin>{<div>admin area</div>}</RequireAdmin> },
        { path: '/login', element: <div>login page</div> },
      ],
      { initialEntries: ['/admin'] },
    );
    render(<RouterProvider router={router} />);
  }

  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it('redirects non-admins to login', () => {
    useAuthStore.setState({ user: { id: 'u1', name: 'Ana', role: 'member' }, token: 't' });
    renderGuardedAt();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders children for admins', () => {
    useAuthStore.setState({ user: { id: 'u2', name: 'Bob', role: 'admin' }, token: 't' });
    renderGuardedAt();
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});
