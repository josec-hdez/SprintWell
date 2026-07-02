import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { ExplainabilityPanel } from '@/features/planning/ExplainabilityPanel';

const GET = vi.mocked(api.GET);

const rule = {
  id: 'r1',
  ownerId: 'ana',
  type: 'PREFER_DOMAIN',
  params: { domain: 'billing' },
  weight: 40,
  isHard: false,
  enabled: true,
  schemaVersion: 1,
};

beforeEach(() => {
  GET.mockReset();
  GET.mockResolvedValue({ data: [rule], error: undefined } as never);
});

describe('ExplainabilityPanel', () => {
  it('explains a member happiness with their rules', async () => {
    render(<ExplainabilityPanel userId="ana" happiness={0.67} />);

    expect(screen.getByRole('heading', { name: /why ana/i })).toBeInTheDocument();
    expect(screen.getByText(/f_j = 0\.67/i)).toBeInTheDocument();
    expect(await screen.findByText('PREFER_DOMAIN')).toBeInTheDocument();
    expect(GET).toHaveBeenCalledWith('/members/{ownerId}/rules', {
      params: { path: { ownerId: 'ana' } },
    });
  });
});
