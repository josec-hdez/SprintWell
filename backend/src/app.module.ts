import { Module } from '@nestjs/common';
import { SystemHealthInfrastructureModule } from './infrastructure/config/system-health.module.js';
import { HealthModule } from './presentation/http/public/health.module.js';

/**
 * Composition root (brief §14, §14.1).
 *
 * This is the ONLY place where Infrastructure implementations are wired to
 * Domain ports. Domain / Application / Infrastructure / Presentation modules
 * MUST NOT import each other across layer boundaries except via the contracts
 * defined in inner layers — wiring lives here.
 *
 * `SystemHealthInfrastructureModule` is `@Global()` so the binding it exports
 * (`SystemHealthRepository → FakeSystemHealthRepository`) is available to the
 * `GetSystemHealthUseCase` provider inside `HealthModule` without forcing
 * `HealthModule` (presentation) to import from `infrastructure/` — which
 * `eslint-plugin-boundaries` would (correctly) reject under §14.1.
 *
 * Imports here use RELATIVE paths instead of the `@infrastructure/*` /
 * `@presentation/*` aliases because `tsc` emits CJS `require()` calls
 * verbatim and the aliases don't resolve at runtime. Switching to
 * `tsconfig-paths/register` or `tsc-alias` is queued for a follow-up issue
 * (trigger: when the composition root exceeds ~5 cross-layer imports).
 */
@Module({
  imports: [SystemHealthInfrastructureModule, HealthModule],
})
export class AppModule {}
