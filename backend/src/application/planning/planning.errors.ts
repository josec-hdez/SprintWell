// Application-layer errors for the Planning context (issue #61).

/** Raised when the optimizer service is unreachable or times out (→ 503). */
export class OptimizerUnavailableError extends Error {
  constructor(reason: string) {
    super(`Optimizer service unavailable: ${reason}`);
    this.name = 'OptimizerUnavailableError';
  }
}
