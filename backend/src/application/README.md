# application

Application layer: orchestration and use cases (commands/queries). Coordinates the domain and infrastructure without holding business rules.

**Rule:** depends only on `domain`. Consumes the repository interfaces (ports) declared in Domain.

Subcontexts: `shared`, `identity`, `team`, `rules`, `sprint`, `planning`.
