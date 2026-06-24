// Pure-TypeScript Sprint aggregate root (issue #51).
//
// §14.1: framework-agnostic. The planning window: a duration, its tasks, and
// the assignments produced by a run. Owns the horizon invariant — an
// assignment must fit: start_day + effort_days ≤ duration_days (brief §5.2).

import { Assignment } from './assignment.js';
import { Task } from './task.js';

export interface SprintProps {
  id: string;
  name: string;
  startDate: Date;
  durationDays: number;
  tasks?: readonly Task[];
  assignments?: readonly Assignment[];
}

export class Sprint {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly startDate: Date,
    public readonly durationDays: number,
    public readonly tasks: readonly Task[],
    public readonly assignments: readonly Assignment[],
  ) {
    Object.freeze(this);
  }

  static create(props: SprintProps): Sprint {
    if (props.id.trim().length === 0) {
      throw new Error('Sprint requires a non-empty id.');
    }
    if (!Number.isInteger(props.durationDays) || props.durationDays < 1) {
      throw new Error(`Sprint duration_days must be an integer ≥ 1, got ${props.durationDays}.`);
    }
    const tasks = Object.freeze([...(props.tasks ?? [])]);
    const assignments = Object.freeze([...(props.assignments ?? [])]);
    const sprint = new Sprint(
      props.id,
      props.name,
      props.startDate,
      props.durationDays,
      tasks,
      assignments,
    );
    for (const assignment of assignments) {
      sprint.assertFits(assignment);
    }
    return sprint;
  }

  findTask(taskId: string): Task | undefined {
    return this.tasks.find((task) => task.id === taskId);
  }

  /** Return a new sprint with the assignment added, enforcing the horizon. */
  assign(taskId: string, userId: string, startDay: number): Sprint {
    const assignment = Assignment.create(taskId, userId, startDay);
    this.assertFits(assignment);
    return new Sprint(this.id, this.name, this.startDate, this.durationDays, this.tasks, [
      ...this.assignments,
      assignment,
    ]);
  }

  private assertFits(assignment: Assignment): void {
    const task = this.findTask(assignment.taskId);
    if (task === undefined) {
      throw new Error(`Assignment references unknown task ${assignment.taskId}.`);
    }
    if (assignment.startDay + task.effortDays > this.durationDays) {
      throw new Error(
        `Assignment of ${task.id} (start ${assignment.startDay} + effort ${task.effortDays}) ` +
          `exceeds sprint duration ${this.durationDays}.`,
      );
    }
  }
}
