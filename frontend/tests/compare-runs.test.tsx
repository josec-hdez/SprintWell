import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  api: { GET: vi.fn(), use: vi.fn() },
}));

import { api } from '@/api/client';
import { RunDiff } from '@/features/planning/RunDiff';
import { CompareRuns } from '@/pages/CompareRuns';
import type { PlanningRun } from '@/features/planning/usePlanningRun';

const GET = vi.mocked(api.GET);

function makeRun(id: string, overrides: Partial<PlanningRun>): PlanningRun {
  return {
    id,
    sprintId: 's1',
    strategy: 'CPSAT',
    equityMode: 'UTILITARIAN',
    status: 'OPTIMAL',
    objectiveValue: 1,
    assignments: [],
    perUserHappiness: [],
    averageHappiness: 0,
    minHappiness: 0,
    createdAt: '2026-05-04T00:00:00.000Z',
    ...overrides,
  } as PlanningRun;
}

const runA = makeRun('a', {
  equityMode: 'UTILITARIAN',
  averageHappiness: 0.6,
  minHappiness: 0.3,
  perUserHappiness: [
    { userId: 'ana', happiness: 0.9 },
    { userId: 'diego', happiness: 0.3 },
  ],
  assignments: [
    { taskId: 't1', userId: 'ana', startDay: 0 },
    { taskId: 't2', userId: 'diego', startDay: 1 },
  ],
});
const runB = makeRun('b', {
  equityMode: 'NASH',
  averageHappiness: 0.8,
  minHappiness: 0.6,
  perUserHappiness: [
    { userId: 'ana', happiness: 1.0 },
    { userId: 'diego', happiness: 0.6 },
  ],
  assignments: [
    { taskId: 't1', userId: 'ana', startDay: 0 },
    { taskId: 't2', userId: 'ana', startDay: 1 },
  ],
});

describe('RunDiff', () => {
  it('shows metric deltas and reassigned tasks', () => {
    render(<RunDiff runA={runA} runB={runB} />);

    expect(screen.getByText('+0.20')).toBeInTheDocument(); // mean 0.6 → 0.8
    expect(screen.getAllByText('+0.30').length).toBeGreaterThan(0); // min + diego deltas
    expect(screen.getByText(/assignment changes \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/t2/)).toBeInTheDocument();
  });
});

describe('CompareRuns', () => {
  beforeEach(() => {
    GET.mockReset();
    GET.mockImplementation((path: string) =>
      Promise.resolve(
        path === '/sprints'
          ? ({ data: [{ id: 's1', name: 'Apollo', startDate: '2026-05-04', durationDays: 14, tasks: [] }], error: undefined } as never)
          : ({ data: [runA, runB], error: undefined } as never),
      ),
    );
  });

  it('loads runs for a sprint and compares the two selected', async () => {
    render(<CompareRuns />);

    fireEvent.change(await screen.findByLabelText('Sprint'), { target: { value: 's1' } });
    fireEvent.change(await screen.findByLabelText('Run A'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Run B'), { target: { value: 'b' } });

    expect(await screen.findByText(/assignment changes/i)).toBeInTheDocument();
    expect(screen.getByText('+0.20')).toBeInTheDocument();
  });
});
