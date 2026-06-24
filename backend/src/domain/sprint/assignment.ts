// Pure-TypeScript Assignment value object (issue #51).
//
// A task placed on a user starting on a sprint day. The horizon invariant
// (start_day + effort ≤ duration) is enforced by the Sprint aggregate, which
// has the duration and the task; the VO itself only guards start_day ≥ 0.

export class Assignment {
  private constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly startDay: number,
  ) {
    Object.freeze(this);
  }

  static create(taskId: string, userId: string, startDay: number): Assignment {
    if (!Number.isInteger(startDay) || startDay < 0) {
      throw new Error(`Assignment start_day must be an integer ≥ 0, got ${startDay}.`);
    }
    return new Assignment(taskId, userId, startDay);
  }
}
