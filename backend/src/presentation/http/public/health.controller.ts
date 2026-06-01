import { Controller, Get } from '@nestjs/common';
import {
  GetSystemHealthUseCase,
  type SystemHealthStatus,
} from '../../../application/shared/get-system-health.use-case.js';

/**
 * Public health probe.
 *
 * Per brief §4.4, the `public` profile sees the health endpoint anonymously.
 * No guards are attached — this controller lives under `presentation/http/public/`
 * which is the anonymous-accessible sub-tree by convention.
 *
 * Implementation note (issue #11): the response is derived from the
 * `GetSystemHealthUseCase` rather than a hard-coded literal. The point is to
 * exercise the full DDD wiring (presentation → application → domain port →
 * infrastructure adapter, bound at the composition root).
 */
@Controller('health')
export class HealthController {
  constructor(private readonly getSystemHealth: GetSystemHealthUseCase) {}

  @Get()
  async check(): Promise<{ status: SystemHealthStatus }> {
    const health = await this.getSystemHealth.execute();
    return { status: health.status };
  }
}
