import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { RuleEditor } from '@/pages/member/RuleEditor';

const GET = vi.mocked(api.GET);
const PUT = vi.mocked(api.PUT);

function rule(id: string, weight: number): Record<string, unknown> {
  return {
    id,
    ownerId: 'u1',
    type: 'PREFER_CATEGORY',
    params: { category: 'feature' },
    weight,
    isHard: false,
    enabled: true,
    schemaVersion: 1,
  };
}

function mockLists(rules: unknown[], conflicts: unknown[] = []): void {
  GET.mockImplementation((path: string) =>
    Promise.resolve(
      path === '/me/rules'
        ? ({ data: rules, error: undefined } as never)
        : ({ data: conflicts, error: undefined } as never),
    ),
  );
}

beforeEach(() => {
  GET.mockReset();
  PUT.mockReset();
  PUT.mockResolvedValue({ response: { ok: true, status: 204 } } as never);
});

describe('RuleEditor', () => {
  it('shows the live budget total and existing rules', async () => {
    mockLists([rule('r1', 30), rule('r2', 20)]);
    render(<RuleEditor />);

    expect(await screen.findByText('50 / 100')).toBeInTheDocument();
    expect(screen.getAllByText('PREFER_CATEGORY')).toHaveLength(2);
  });

  it('renders the conflict banner when the backend reports conflicts', async () => {
    mockLists(
      [rule('r1', 30)],
      [{ ruleIds: ['r1', 'r2'], target: 'category', value: 'feature', description: 'prefer vs avoid feature' }],
    );
    render(<RuleEditor />);

    expect(await screen.findByText(/1 rule conflict detected/i)).toBeInTheDocument();
    expect(screen.getByText(/prefer vs avoid feature/i)).toBeInTheDocument();
  });

  it('adds a rule through the modal', async () => {
    mockLists([]);
    render(<RuleEditor />);
    await screen.findByText(/no rules yet/i);

    fireEvent.click(screen.getByRole('button', { name: /add rule/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save rule/i }));

    await waitFor(() => {
      expect(PUT).toHaveBeenCalledWith(
        '/me/rules/{ruleId}',
        expect.objectContaining({ body: expect.objectContaining({ type: 'PREFER_CATEGORY' }) }),
      );
    });
  });

  it('blocks adding a rule that would exceed the budget', async () => {
    mockLists([rule('r1', 90)]);
    render(<RuleEditor />);
    await screen.findByText('90 / 100');

    fireEvent.click(screen.getByRole('button', { name: /add rule/i }));
    // Modal default weight is 20 → 90 + 20 = 110 > 100.
    fireEvent.click(screen.getByRole('button', { name: /save rule/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/exceed the 100-point budget/i);
    expect(PUT).not.toHaveBeenCalled();
  });
});
