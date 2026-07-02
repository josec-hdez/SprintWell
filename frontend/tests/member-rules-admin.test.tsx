import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { MemberRulesAdmin } from '@/pages/admin/MemberRulesAdmin';

const GET = vi.mocked(api.GET);

const member = { id: 'u1', email: 'ana@x.com', name: 'Ana', role: 'MEMBER' };
const rule = {
  id: 'r1',
  ownerId: 'u1',
  type: 'PREFER_DOMAIN',
  params: { domain: 'billing' },
  weight: 40,
  isHard: false,
  enabled: true,
  schemaVersion: 1,
};

beforeEach(() => {
  GET.mockReset();
  GET.mockImplementation((path: string) =>
    Promise.resolve(
      path === '/admin/members'
        ? ({ data: [member], error: undefined } as never)
        : path === '/members/{ownerId}/rules'
          ? ({ data: [rule], error: undefined } as never)
          : ({ data: [], error: undefined } as never),
    ),
  );
});

describe('MemberRulesAdmin', () => {
  it('edits a selected member rules with the reused editor', async () => {
    render(<MemberRulesAdmin />);

    // The member appears in the selector once loaded.
    await screen.findByRole('option', { name: /ana \(ana@x\.com\)/i });

    fireEvent.change(screen.getByLabelText('Member'), { target: { value: 'u1' } });

    expect(await screen.findByRole('heading', { name: /rules for ana/i })).toBeInTheDocument();
    expect(screen.getByText('PREFER_DOMAIN')).toBeInTheDocument();
    expect(GET).toHaveBeenCalledWith('/members/{ownerId}/rules', {
      params: { path: { ownerId: 'u1' } },
    });
  });
});
