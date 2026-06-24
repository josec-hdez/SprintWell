import { Sprint } from './sprint.js';
import { TaskStatus } from './task-status.js';
import { Task } from './task.js';

function makeTask(id: string, effortDays = 2): Task {
  return Task.create({ id, name: id, effortDays, category: 'feature', domain: 'd' });
}

describe('Task', () => {
  it('rejects effort_days below 1', () => {
    expect(() => makeTask('t', 0)).toThrow(/effort_days must be an integer ≥ 1/);
  });

  it('accepts effort_days ≥ 1 and defaults to TODO', () => {
    expect(makeTask('t', 1).status.value).toBe('TODO');
  });
});

describe('TaskStatus transitions', () => {
  it('allows the forward path TODO → IN_PROGRESS → DONE', () => {
    const inProgress = TaskStatus.initial().transitionTo('IN_PROGRESS');
    expect(inProgress.value).toBe('IN_PROGRESS');
    expect(inProgress.transitionTo('DONE').value).toBe('DONE');
  });

  it('rejects skipping (TODO → DONE) and going backwards (DONE → IN_PROGRESS)', () => {
    expect(() => TaskStatus.initial().transitionTo('DONE')).toThrow(/Illegal task status/);
    const done = TaskStatus.initial().transitionTo('IN_PROGRESS').transitionTo('DONE');
    expect(() => done.transitionTo('IN_PROGRESS')).toThrow(/Illegal task status/);
  });

  it('blocks from any state and unblocks to the previous state', () => {
    const inProgress = TaskStatus.initial().transitionTo('IN_PROGRESS');
    const blocked = inProgress.transitionTo('BLOCKED');
    expect(blocked.isBlocked()).toBe(true);
    expect(blocked.transitionTo('IN_PROGRESS').value).toBe('IN_PROGRESS'); // back to previous
    expect(() => blocked.transitionTo('TODO')).toThrow(/can only return to IN_PROGRESS/);
  });
});

describe('Sprint horizon invariant', () => {
  it('rejects a duration below 1', () => {
    expect(() =>
      Sprint.create({ id: 's', name: 'S', startDate: new Date('2026-05-04'), durationDays: 0 }),
    ).toThrow(/duration_days must be an integer ≥ 1/);
  });

  it('accepts an assignment that fits within the horizon', () => {
    const sprint = Sprint.create({
      id: 's',
      name: 'S',
      startDate: new Date('2026-05-04'),
      durationDays: 5,
      tasks: [makeTask('t1', 2)],
    });
    const assigned = sprint.assign('t1', 'u1', 3); // 3 + 2 = 5 ≤ 5
    expect(assigned.assignments).toHaveLength(1);
  });

  it('rejects an assignment that exceeds the horizon', () => {
    const sprint = Sprint.create({
      id: 's',
      name: 'S',
      startDate: new Date('2026-05-04'),
      durationDays: 5,
      tasks: [makeTask('t1', 2)],
    });
    expect(() => sprint.assign('t1', 'u1', 4)).toThrow(/exceeds sprint duration/); // 4 + 2 = 6 > 5
  });

  it('rejects an assignment to an unknown task', () => {
    const sprint = Sprint.create({
      id: 's',
      name: 'S',
      startDate: new Date('2026-05-04'),
      durationDays: 5,
      tasks: [],
    });
    expect(() => sprint.assign('ghost', 'u1', 0)).toThrow(/unknown task/);
  });
});
