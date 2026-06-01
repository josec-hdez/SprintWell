// Infrastructure module that binds the `SystemHealthRepository` domain port
// to the `FakeSystemHealthRepository` adapter.
//
// Why a dedicated module (and why `@Global()`)?
//
// Brief §14.1 forbids `presentation → infrastructure` imports, so the
// `HealthModule` (presentation) cannot register the concrete adapter itself.
// The binding has to live somewhere reachable by Nest's injector AND by the
// ESLint boundaries plugin. Two valid placements exist:
//
//   1. Inline as a provider inside `AppModule` — works, but every future
//      infrastructure-port binding piles up in the composition root.
//   2. A dedicated infrastructure module the composition root imports.
//
// We pick (2). Marking it `@Global()` means any module imported by `AppModule`
// can resolve `SystemHealthRepository` without having to import this module
// explicitly — keeping `HealthModule` free of an `infrastructure/` import
// (which boundaries would reject). The composition root remains the SOLE
// place that knows which concrete adapter is bound.

import { Global, Module } from '@nestjs/common';
import { SystemHealthRepository } from '../../domain/shared/system-health.js';
import { FakeSystemHealthRepository } from './fake-system-health.repository.js';

@Global()
@Module({
  providers: [
    {
      provide: SystemHealthRepository,
      useClass: FakeSystemHealthRepository,
    },
  ],
  exports: [SystemHealthRepository],
})
export class SystemHealthInfrastructureModule {}
