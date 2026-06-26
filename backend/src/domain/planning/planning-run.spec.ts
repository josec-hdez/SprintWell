import { Assignment } from '../sprint/assignment.js';
import { HappinessScore } from './happiness-score.js';
import { PlanningRun, type PlanningRunProps } from './planning-run.js';
import { PlanningStrategy } from './planning-strategy.js';

function baseProps(overrides: Partial<PlanningRunProps> = {}): PlanningRunProps {
  return {
    id: 'run-1',
    sprintId: 's1',
    strategy: PlanningStrategy.of('CPSAT'),
    equityMode: 'UTILITARIAN',
    status: 'OPTIMAL',
    objectiveValue: 12.5,
    assignments: [Assignment.create('t1', 'u1', 0)],
    perUserHappiness: [
      { userId: 'u1', score: HappinessScore.of(0.8) },
      { userId: 'u2', score: HappinessScore.of(0.4) },
    ],
    createdAt: new Date('2026-05-04'),
    ...overrides,
  };
}

describe('PlanningStrategy', () => {
  it('rejects an unknown strategy', () => {
    expect(() => PlanningStrategy.of('GENETIC')).toThrow(/Invalid planning strategy/);
  });
});

describe('HappinessScore', () => {
  it('rejects values outside [0, 1]', () => {
    expect(() => HappinessScore.of(-0.1)).toThrow(/in \[0, 1\]/);
    expect(() => HappinessScore.of(1.1)).toThrow(/in \[0, 1\]/);
  });
});

describe('PlanningRun', () => {
  it('is immutable once created', () => {
    const run = PlanningRun.create(baseProps());
    expect(() => {
      (run as unknown as { status: string }).status = 'INFEASIBLE';
    }).toThrow();
  });

  it('computes average and minimum happiness', () => {
    const run = PlanningRun.create(baseProps());
    expect(run.averageHappiness()).toBeCloseTo(0.6);
    expect(run.minHappiness()).toBeCloseTo(0.4);
  });

  it('enforces the INFEASIBLE / objective-value invariants', () => {
    expect(() =>
      PlanningRun.create(baseProps({ status: 'INFEASIBLE', objectiveValue: 1 })),
    ).toThrow(/INFEASIBLE/);
    expect(() =>
      PlanningRun.create(baseProps({ status: 'OPTIMAL', objectiveValue: null })),
    ).toThrow(/non-null objective/);
  });

  it('allows an INFEASIBLE run with a null objective', () => {
    const run = PlanningRun.create(
      baseProps({
        status: 'INFEASIBLE',
        objectiveValue: null,
        assignments: [],
        perUserHappiness: [],
      }),
    );
    expect(run.status).toBe('INFEASIBLE');
    expect(run.averageHappiness()).toBe(0);
  });

  it('rejects an invalid equity mode', () => {
    expect(() =>
      PlanningRun.create(baseProps({ equityMode: 'AVERAGE' as unknown as 'UTILITARIAN' })),
    ).toThrow(/Invalid equity mode/);
  });
});
