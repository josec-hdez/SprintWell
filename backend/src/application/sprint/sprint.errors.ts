// Application-layer errors for the Sprint context (issue #52).

import type { TaskStatusValue } from '../../domain/sprint/task-status.js';

export class SprintNotFoundError extends Error {
  constructor(sprintId: string) {
    super(`Sprint not found: ${sprintId}.`);
    this.name = 'SprintNotFoundError';
  }
}

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task not found: ${taskId}.`);
    this.name = 'TaskNotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(from: TaskStatusValue, to: TaskStatusValue) {
    super(`Illegal task status transition: ${from} → ${to}.`);
    this.name = 'InvalidTransitionError';
  }
}

/** Raised when a member tries to change the status of a task they do not own. */
export class TaskOwnershipError extends Error {
  constructor(taskId: string) {
    super(`You are not assigned to task ${taskId}.`);
    this.name = 'TaskOwnershipError';
  }
}
