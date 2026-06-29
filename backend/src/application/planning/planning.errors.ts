// Application-layer errors for the Planning context (issue #61).

/** Raised when the optimizer service is unreachable or times out (→ 503). */
export class OptimizerUnavailableError extends Error {
  constructor(reason: string) {
    super(`Optimizer service unavailable: ${reason}`);
    this.name = 'OptimizerUnavailableError';
  }
}

/** Raised when a planning run id is unknown (→ 404). */
export class PlanningRunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Planning run not found: ${runId}.`);
    this.name = 'PlanningRunNotFoundError';
  }
}
