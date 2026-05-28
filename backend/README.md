# backend

NestJS + TypeScript + Prisma API. Organized with strict **DDD in 4 layers** (`domain`, `application`, `infrastructure`, `presentation`).

**Layer dependency rule (brief §14.1):** dependencies point inward only — Domain depends on nothing; Application depends on Domain; Infrastructure implements Domain ports; Presentation depends on Application. The wiring happens only in the composition root (`app.module.ts`).

Per-service tooling (`package.json`, `tsconfig.json`, `nest-cli.json`, Prisma schema) is bootstrapped in later week-1 issues.
