import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { PublicSprints } from '@/pages/PublicSprints';

const GET = vi.mocked(api.GET);

interface SprintShape {
  id: string;
  name: string;
  startDate: string;
  durationDays: number;
  tasks: unknown[];
}

function sprint(id: string): SprintShape {
  return { id, name: `Sprint ${id}`, startDate: '2026-05-04', durationDays: 14, tasks: [] };
}

function resolveWith(data: SprintShape[] | undefined, error?: unknown): void {
  GET.mockResolvedValue({ data, error } as never);
}

describe('PublicSprints', () => {
  beforeEach(() => {
    GET.mockReset();
  });

  it('renders the sprint list once loaded', async () => {
    resolveWith([sprint('a'), sprint('b')]);
    render(
      <MemoryRouter>
        <PublicSprints />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Sprint a')).toBeInTheDocument();
    expect(screen.getByText('Sprint b')).toBeInTheDocument();
    expect(GET).toHaveBeenCalledWith('/sprints');
  });

  it('shows an empty state when there are no sprints', async () => {
    resolveWith([]);
    render(
      <MemoryRouter>
        <PublicSprints />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no sprints yet/i)).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    resolveWith(undefined, { message: 'boom' });
    render(
      <MemoryRouter>
        <PublicSprints />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load sprints/i);
  });

  it('pages the list with Load more', async () => {
    resolveWith(Array.from({ length: 12 }, (_, i) => sprint(String(i))));
    render(
      <MemoryRouter>
        <PublicSprints />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Sprint 0')).toBeInTheDocument();
    expect(screen.queryByText('Sprint 11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(screen.getByText('Sprint 11')).toBeInTheDocument();
  });
});
