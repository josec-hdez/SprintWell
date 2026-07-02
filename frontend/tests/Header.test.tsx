import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';

import type { SessionUser } from '@/auth/session';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/stores/auth.store';

function renderHeader(user: SessionUser | null): void {
  useAuthStore.setState({ user, token: user === null ? null : 'test-token' });
  const router = createMemoryRouter([{ path: '/', element: <Header /> }], {
    initialEntries: ['/'],
  });
  render(<RouterProvider router={router} />);
}

const member: SessionUser = { id: 'u1', name: 'Alice', role: 'member' };
const admin: SessionUser = { id: 'u2', name: 'Bob', role: 'admin' };

describe('Header', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
    localStorage.clear();
  });

  it('shows a Login action when anonymous and no user menu', () => {
    renderHeader(null);
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /alice|bob/i })).not.toBeInTheDocument();
  });

  it('shows the member name and reveals Logout from the menu', () => {
    renderHeader(member);
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /alice/i });
    expect(screen.queryByRole('menuitem', { name: /logout/i })).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
  });

  it('logs the user out, falling back to the anonymous header', () => {
    renderHeader(member);
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /logout/i }));
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /alice/i })).not.toBeInTheDocument();
  });

  it('renders member navigation but not admin destinations', () => {
    renderHeader(member);
    expect(screen.getByRole('link', { name: /my tasks/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^team$/i })).not.toBeInTheDocument();
  });

  it('renders admin navigation destinations', () => {
    renderHeader(admin);
    expect(screen.getByRole('link', { name: /^team$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /compare/i })).toBeInTheDocument();
  });
});
