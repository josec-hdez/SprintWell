# domain

Domain layer: entities, value objects, aggregates, and pure business rules.

**Rule:** zero dependencies on any other layer or framework (no NestJS, no Prisma). Pure TypeScript only. Repository **interfaces** (ports) are declared here; implementations live in `infrastructure`.

Subcontexts: `shared`, `identity`, `team`, `rules`, `sprint`, `planning`.
