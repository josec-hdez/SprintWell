import { Module } from '@nestjs/common';
import { GetSystemHealthUseCase } from '../../../application/shared/get-system-health.use-case.js';
import { HealthController } from './health.controller.js';

/**
 * Presentation module for the public `/health` endpoint.
 *
 * Declares `GetSystemHealthUseCase` as a local provider so the controller can
 * inject it. The domain port (`SystemHealthRepository`) that the use case
 * depends on is bound at the composition root via
 * `SystemHealthInfrastructureModule` (registered as `@Global()`), so this
 * module never has to know about — let alone import — the concrete
 * infrastructure adapter. That keeps §14.1's `presentation → application`
 * boundary intact.
 */
@Module({
  controllers: [HealthController],
  providers: [GetSystemHealthUseCase],
})
export class HealthModule {}
