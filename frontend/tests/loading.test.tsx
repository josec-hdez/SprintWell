import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Loading } from '@/components/ui/loading';

describe('Loading', () => {
  it('renders a status role with the given label', () => {
    render(<Loading label="Loading sprints…" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading sprints…');
  });

  it('defaults the label', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });
});
