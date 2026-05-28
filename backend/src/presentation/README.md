# presentation

Presentation layer: inbound HTTP/REST adapters.

**Rule:** depends on `application` (wired via DI in `app.module.ts`). Holds only controllers, DTOs, guards, decorators, and filters — no business rules.

Areas: `http` (`public`/`member`/`admin`), `dto`, `guards`, `decorators`, `filters`.
