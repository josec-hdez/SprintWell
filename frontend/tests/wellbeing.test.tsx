import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { WellbeingDashboard } from '@/features/planning/WellbeingDashboard';
import type { PlanningRun } from '@/features/planning/usePlanningRun';

const run = {
  id: 'run1',
  sprintId: 's1',
  strategy: 'CPSAT',
  equityMode: 'NASH',
  status: 'OPTIMAL',
  objectiveValue: 1,
  assignments: [],
  perUserHappiness: [
    { userId: 'ana', happiness: 0.9 },
    { userId: 'diego', happiness: 0.3 },
    { userId: 'beto', happiness: 0.6 },
  ],
  averageHappiness: 0.6,
  minHappiness: 0.3,
  createdAt: '2026-05-04T00:00:00.000Z',
} as unknown as PlanningRun;

describe('WellbeingDashboard', () => {
  it('renders the global metric labels and a bar per member', () => {
    render(<WellbeingDashboard run={run} />);

    expect(screen.getByText('Mean happiness')).toBeInTheDocument();
    expect(screen.getByText('Min happiness')).toBeInTheDocument();
    expect(screen.getByText('Max happiness')).toBeInTheDocument();
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('diego')).toBeInTheDocument();
    expect(screen.getByText('beto')).toBeInTheDocument();
  });

  it('sorts members worst-off first', () => {
    render(<WellbeingDashboard run={run} />);
    const labels = screen.getAllByText(/^(ana|beto|diego)$/).map((node) => node.textContent);
    expect(labels).toEqual(['diego', 'beto', 'ana']);
  });
});
