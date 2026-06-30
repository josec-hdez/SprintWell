import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';

const login = vi.fn();

// Mock the auth store so the screen never touches the network; `useAuthStore`
// is a selector hook just like the real one.
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { login: typeof login }) => unknown) => selector({ login }),
}));

import { Login } from '@/pages/Login';

function renderLogin(): void {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <Login /> },
      { path: '/', element: <div>home page</div> },
    ],
    { initialEntries: ['/login'] },
  );
  render(<RouterProvider router={router} />);
}

function fillAndSubmit(): void {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@x.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('Login screen', () => {
  beforeEach(() => {
    login.mockReset();
  });

  it('submits credentials and redirects home on success', async () => {
    login.mockResolvedValue(undefined);
    renderLogin();

    fillAndSubmit();

    expect(await screen.findByText('home page')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ email: 'a@x.com', password: 'secret' });
  });

  it('shows a readable error on invalid credentials', async () => {
    login.mockRejectedValue(new Error('Invalid email or password.'));
    renderLogin();

    fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/invalid email or password/i);
  });

  it('shows a server error when the request fails', async () => {
    login.mockRejectedValue(new TypeError('Failed to fetch'));
    renderLogin();

    fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not reach the server/i);
  });
});
