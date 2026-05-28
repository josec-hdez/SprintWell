# infrastructure

Infrastructure layer: concrete implementations of the ports declared in `domain` (persistence, HTTP clients, auth, config).

**Rule:** implements Domain interfaces and depends inward on Application/Domain. Prisma classes never leave this layer — mappers translate to domain entities before crossing the boundary.

Areas: `persistence`, `optimizer`, `auth`, `config`.
