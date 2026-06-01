// In-memory fake adapter for the `SystemHealthRepository` port.
//
// Located under `infrastructure/config/` because brief §14 lists only
// `{auth, config, optimizer, persistence}` as infrastructure subdirectories
// (no `shared/`). A health probe is a system-configuration concern, so
// `config/` is the closest semantic fit without inventing a new folder.
//
// This adapter exists ONLY to satisfy the issue #11 smoke wiring. Real
// implementations (DB ping, queue probe, optimizer ping, etc.) will replace
// it by re-binding the port in the composition root — the rest of the
// application code stays untouched.

import { Injectable } from '@nestjs/common';
import { SystemHealth, SystemHealthRepository } from '../../domain/shared/system-health.js';

@Injectable()
export class FakeSystemHealthRepository extends SystemHealthRepository {
  get(): Promise<SystemHealth> {
    return Promise.resolve(SystemHealth.ok());
  }
}
