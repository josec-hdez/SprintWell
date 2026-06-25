// Domain port for resolving who a task is assigned to (issue #54).
//
// Ownership of a task derives from its assignment (produced by a planning run).
// This query lets the member status endpoint check that the authenticated user
// is the assignee before allowing a status change, without the Sprint context
// depending on the Planning context's aggregates.

export abstract class TaskAssignmentQuery {
  /** Return the user id currently assigned to ``taskId``, or `null` if none. */
  abstract findAssignee(taskId: string): Promise<string | null>;
}
