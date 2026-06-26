// HTTP client implementing the PlanningSolver port (issue #61).
//
// §4.3: the backend calls the optimizer synchronously over HTTP. The algorithm
// is selected via the `?algorithm=` query (per the optimizer endpoint), the
// payload is the adapted ProblemInput, and connection/timeout failures surface
// as OptimizerUnavailableError. An INFEASIBLE run is a normal 200 response, not
// an error — it flows through as a SolverResult.

import { Injectable } from '@nestjs/common';
import axios from 'axios';

import {
  PlanningSolver,
  type SolverRequest,
  type SolverResult,
} from '../../domain/planning/planning-solver.js';
import type { PlanningStrategyValue } from '../../domain/planning/planning-strategy.js';
import { OptimizerUnavailableError } from '../../application/planning/planning.errors.js';
import { ProblemInputAdapter, type WireSolverOutput } from './problem-input.adapter.js';

const OPTIMIZER_URL = process.env.OPTIMIZER_URL ?? 'http://localhost:8000';
const TIMEOUT_BUFFER_S = 5;

const STRATEGY_QUERY: Record<PlanningStrategyValue, string> = {
  CPSAT: 'cpsat',
  RANDOM: 'random',
  GREEDY: 'greedy',
};

@Injectable()
export class OptimizerHttpClient extends PlanningSolver {
  async solve(request: SolverRequest): Promise<SolverResult> {
    const body = ProblemInputAdapter.toProblemInput(request);
    const algorithm = STRATEGY_QUERY[request.strategy];
    const timeoutMs = ((request.timeBudgetSeconds ?? 30) + TIMEOUT_BUFFER_S) * 1000;

    try {
      const response = await axios.post<WireSolverOutput>(
        `${OPTIMIZER_URL}/solve?algorithm=${algorithm}`,
        body,
        { timeout: timeoutMs },
      );
      return ProblemInputAdapter.toResult(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new OptimizerUnavailableError(error.code ?? error.message);
      }
      throw error;
    }
  }
}
