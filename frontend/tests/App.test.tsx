import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { Home } from '@/routes/Home';

describe('App', () => {
  it('renders the shadcn Button on Home', () => {
    const router = createMemoryRouter([{ path: '/', element: <Home /> }]);
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sprintwell/i })).toBeInTheDocument();
  });
});
