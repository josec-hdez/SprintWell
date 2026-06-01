// Application-layer use case for retrieving the current system health.
//
// Pragmatic concession on §14.1: this file imports `@Injectable` from
// `@nestjs/common`. The brief restricts the DOMAIN layer to plain TypeScript,
// but the APPLICATION layer is the natural home for orchestration and is the
// boundary where the DI container needs to know how to construct the use case.
// `@Injectable()` is accepted here as the minimum Nest-coupling necessary to
// participate in the composition root. Domain artefacts (SystemHealth,
// SystemHealthRepository) remain untouched by framework annotations.

import { Injectable } from '@nestjs/common';
import {
  SystemHealth,
  SystemHealthRepository,
  type SystemHealthStatus,
} from '../../domain/shared/system-health.js';

// Re-export the status union so the presentation layer can name the response
// shape without having to import directly from `domain/` — §14.1 only allows
// `presentation → application`. The type travels through application as the
// natural contract surface for the use case's result.
export type { SystemHealthStatus };

/**
 * Returns the current `SystemHealth` by delegating to the domain port.
 *
 * The controller depends on this use case (not on the repository directly)
 * so the presentation layer never needs to know what concrete adapter is
 * bound at the composition root — §14.1 keeps `presentation → application`
 * one-way.
 */
@Injectable()
export class GetSystemHealthUseCase {
  constructor(private readonly repository: SystemHealthRepository) {}

  execute(): Promise<SystemHealth> {
    return this.repository.get();
  }
}
