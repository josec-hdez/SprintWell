// Pure-TypeScript Task entity within a Sprint (issue #51).
//
// §14.1: framework-agnostic. Owns the per-task invariants (effort ≥ 1, valid
// optional deadline). Category/domain are free strings here; the optimizer
// adapter maps them to the solver contract.

import { TaskStatus } from './task-status.js';

export interface TaskProps {
  id: string;
  name: string;
  effortDays: number;
  category: string;
  domain: string;
  deadlineDay?: number;
  requiredSkills?: readonly string[];
  dependsOn?: readonly string[];
  status?: TaskStatus;
}

export class Task {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly effortDays: number,
    public readonly category: string,
    public readonly domain: string,
    public readonly deadlineDay: number | null,
    public readonly requiredSkills: readonly string[],
    public readonly dependsOn: readonly string[],
    public readonly status: TaskStatus,
  ) {
    Object.freeze(this);
  }

  static create(props: TaskProps): Task {
    if (props.id.trim().length === 0) {
      throw new Error('Task requires a non-empty id.');
    }
    if (!Number.isInteger(props.effortDays) || props.effortDays < 1) {
      throw new Error(`Task effort_days must be an integer ≥ 1, got ${props.effortDays}.`);
    }
    if (
      props.deadlineDay !== undefined &&
      (!Number.isInteger(props.deadlineDay) || props.deadlineDay < 0)
    ) {
      throw new Error(`Task deadline_day must be an integer ≥ 0, got ${props.deadlineDay}.`);
    }
    return new Task(
      props.id,
      props.name,
      props.effortDays,
      props.category,
      props.domain,
      props.deadlineDay ?? null,
      Object.freeze([...(props.requiredSkills ?? [])]),
      Object.freeze([...(props.dependsOn ?? [])]),
      props.status ?? TaskStatus.initial(),
    );
  }

  /** Return a copy of the task with its status transitioned. */
  withStatus(next: TaskStatus): Task {
    return new Task(
      this.id,
      this.name,
      this.effortDays,
      this.category,
      this.domain,
      this.deadlineDay,
      this.requiredSkills,
      this.dependsOn,
      next,
    );
  }
}
