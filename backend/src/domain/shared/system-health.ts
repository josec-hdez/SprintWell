// Pure-TypeScript domain artefacts for the `system-health` cross-cutting probe.
//
// This file deliberately contains BOTH the `SystemHealth` value object and the
// `SystemHealthRepository` abstract-class port. The decision to co-locate (instead
// of splitting into two files) reflects the brief §14.1 rule that domain modules
// must remain framework-agnostic: there are no Nest decorators here, no DI, no
// side effects — just a value object and the contract that produces it. Keeping
// both in one small module makes the port-VO coupling explicit and shrinks the
// surface area for the smoke wiring of issue #11.
//
// IMPORTANT (§14.1): no imports from `application/`, `infrastructure/`, or
// `presentation/` are allowed here. Verified by `eslint-plugin-boundaries`.

/**
 * Status literal accepted by the {@link SystemHealth} value object.
 *
 * `degraded` is kept in the union so the type isn't pinned to a single literal
 * (which would make every consumer trivially infer `'ok'`). It's not produced
 * by the current fake adapter — future real adapters (DB ping, optimizer probe,
 * etc.) will populate it.
 */
export type SystemHealthStatus = 'ok' | 'degraded';

/**
 * Value Object describing the overall health of the SprintWell backend.
 *
 * Runtime immutability is enforced via `Object.freeze(this)` in the constructor
 * so this is a proper DDD VO, not a structurally-readonly type alias.
 */
export class SystemHealth {
  constructor(public readonly status: SystemHealthStatus) {
    Object.freeze(this);
  }

  /** Convenience factory for the healthy state. */
  static ok(): SystemHealth {
    return new SystemHealth('ok');
  }
}

/**
 * Domain port for retrieving the current {@link SystemHealth}.
 *
 * Declared as an `abstract class` (rather than an `interface` or `Symbol`
 * token) so it doubles as BOTH the TypeScript contract AND the runtime
 * NestJS DI token. This keeps `domain/` free of Nest decorators while still
 * being injectable from `application/` consumers — the composition root
 * (`app.module.ts`) binds this token to a concrete `infrastructure/` adapter.
 *
 * Implementations live in `infrastructure/` per §14.1.
 */
export abstract class SystemHealthRepository {
  abstract get(): Promise<SystemHealth>;
}
