// Pure-TypeScript value object for a task's lifecycle status (issue #51).
//
// §14.1: framework-agnostic. Encodes the legal transitions (brief §5.2):
//   TODO → IN_PROGRESS → DONE   (forward only)
//   any non-blocked → BLOCKED   (remembering where it came from)
//   BLOCKED → its previous state (unblock returns to where it was)

export type TaskStatusValue = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

const FORWARD: Record<TaskStatusValue, readonly TaskStatusValue[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE'],
  DONE: [],
  BLOCKED: [],
};

export class TaskStatus {
  private constructor(
    public readonly value: TaskStatusValue,
    private readonly blockedFrom: TaskStatusValue | null,
  ) {
    Object.freeze(this);
  }

  /** The status a freshly created task starts in. */
  static initial(): TaskStatus {
    return new TaskStatus('TODO', null);
  }

  /** Reconstruct from a stored value (no block-history is persisted). */
  static of(value: TaskStatusValue): TaskStatus {
    if (!(value in FORWARD)) {
      throw new Error(`Invalid task status: ${value}.`);
    }
    return new TaskStatus(value, null);
  }

  isBlocked(): boolean {
    return this.value === 'BLOCKED';
  }

  /** Return the next status, or throw if the transition is illegal. */
  transitionTo(next: TaskStatusValue): TaskStatus {
    if (next === this.value) {
      throw new Error(`Task is already ${this.value}.`);
    }
    if (next === 'BLOCKED') {
      return new TaskStatus('BLOCKED', this.value);
    }
    if (this.value === 'BLOCKED') {
      // Unblock: return to the remembered state; when none is known (a status
      // reconstructed from storage) allow only the non-terminal entry states.
      const allowed = this.blockedFrom !== null ? [this.blockedFrom] : ['TODO', 'IN_PROGRESS'];
      if (!allowed.includes(next)) {
        throw new Error(`Blocked task can only return to ${allowed.join(', ')}, not ${next}.`);
      }
      return new TaskStatus(next, null);
    }
    if (!FORWARD[this.value].includes(next)) {
      throw new Error(`Illegal task status transition: ${this.value} → ${next}.`);
    }
    return new TaskStatus(next, null);
  }

  canTransitionTo(next: TaskStatusValue): boolean {
    try {
      this.transitionTo(next);
      return true;
    } catch {
      return false;
    }
  }
}
