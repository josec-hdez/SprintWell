import axios from 'axios';

import type { SolverRequest } from '../../domain/planning/planning-solver.js';
import { Sprint } from '../../domain/sprint/sprint.js';
import { OptimizerUnavailableError } from '../../application/planning/planning.errors.js';
import { OptimizerHttpClient } from './optimizer.client.js';

jest.mock('axios');

const post = axios.post as unknown as jest.Mock;
const isAxiosError = axios.isAxiosError as unknown as jest.Mock;

function request(strategy: SolverRequest['strategy'] = 'CPSAT'): SolverRequest {
  return {
    sprint: Sprint.create({
      id: 's1',
      name: 'S',
      startDate: new Date('2026-05-04'),
      durationDays: 5,
    }),
    members: [],
    skills: [],
    rules: [],
    equityMode: 'UTILITARIAN',
    strategy,
  };
}

describe('OptimizerHttpClient', () => {
  const client = new OptimizerHttpClient();

  beforeEach(() => {
    post.mockReset();
    isAxiosError.mockReset();
  });

  it('posts to the algorithm-specific endpoint and maps the result', async () => {
    post.mockResolvedValue({
      data: {
        status: 'OPTIMAL',
        objective_value: 3,
        assignments: [],
        per_user_happiness: [],
        message: null,
      },
    });

    const result = await client.solve(request('GREEDY'));

    expect(result.status).toBe('OPTIMAL');
    const calledUrl = post.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('/solve?algorithm=greedy');
  });

  it('passes through an INFEASIBLE run as a normal result', async () => {
    post.mockResolvedValue({
      data: {
        status: 'INFEASIBLE',
        objective_value: null,
        assignments: [],
        per_user_happiness: [],
        message: 'no feasible plan',
      },
    });
    const result = await client.solve(request());
    expect(result.status).toBe('INFEASIBLE');
    expect(result.objectiveValue).toBeNull();
  });

  it('maps a connection/timeout failure to OptimizerUnavailableError', async () => {
    post.mockRejectedValue(new Error('ECONNREFUSED'));
    isAxiosError.mockReturnValue(true);
    await expect(client.solve(request())).rejects.toBeInstanceOf(OptimizerUnavailableError);
  });
});
