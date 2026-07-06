# Capítulo 5 — Sistema implementado

Este capítulo describe el sistema tal como quedó construido: tres servicios independientes, sus contratos, la persistencia, el _tooling_ y los puntos donde la implementación se desvía del diseño teórico, con su justificación. Es el aporte de producto (§1.3.3) y, por peso en la evaluación, la entrega central del TFM.

## 5.1 Arquitectura en tres servicios

SprintWell se compone de tres servicios desplegables por separado (brief §4):

- **`backend/`** — API REST en **NestJS 11** con arquitectura DDD en cuatro capas, persistencia **Prisma 6 + PostgreSQL 16**. Es la fuente de verdad del dominio (equipos, sprints, tareas, reglas, planificaciones) y el único servicio con estado.
- **`optimizer/`** — microservicio en **Python** con **FastAPI + OR-Tools/CP-SAT**. Sin estado: recibe un `ProblemInput`, resuelve y devuelve un `SolverOutput`. Expone también dos CLIs (`sprintwell-solve`, `sprintwell-gen`) reutilizadas por el benchmark.
- **`frontend/`** — SPA en **React 19 + Vite + Tailwind v4 + shadcn/ui**, con un **cliente tipado generado desde el OpenAPI del backend**.

La separación en tres servicios con lenguajes distintos no es gratuita: aísla el núcleo de optimización (Python, donde OR-Tools es idiomático) del núcleo de negocio (TypeScript, con tipado estricto de extremo a extremo), y permite escalar y desplegar el _solver_ de forma independiente.

## 5.2 Backend: DDD en cuatro capas

El backend sigue una arquitectura hexagonal/DDD en cuatro capas (brief §14.1), **con la dependencia dirigida hacia adentro**:

```
presentation → application → domain
                    ↑             ↑
              infrastructure ──────┘   (implementa puertos del dominio)
```

- **`domain/`** — TypeScript puro, sin framework. Agregados (`Sprint`, `PlanningRun`, `User`, `Rule`), _value objects_ inmutables (constructor privado + `Object.freeze(this)` + factorías estáticas que validan y lanzan `Error`), y **puertos** de repositorio como `abstract class` (contrato TS + _token_ de DI).
- **`application/`** — casos de uso (`@Injectable`), _views_ de lectura (proyecciones planas de los agregados; presentación nunca importa dominio, sino estas _views_).
- **`infrastructure/`** — adaptadores Prisma de los puertos, cliente HTTP del optimizer, adaptadores argon2 (hashing) y JWT (tokens).
- **`presentation/`** — controladores HTTP (admin / member / public), _guards_ de rol, DTOs con `class-validator`, y un `ApplicationExceptionFilter` global que mapea errores de aplicación a códigos HTTP (409 conflictos, 401 credenciales, 403 propiedad/rol, 503 optimizer caído, 404 por defecto).

La regla de capas se **verifica automáticamente** con `eslint-plugin-boundaries`: una violación (p. ej. presentación importando dominio) rompe el _lint_ y, por tanto, CI. El _composition root_ —único lugar donde se conectan puertos y adaptadores— vive en `app.module.ts`; los módulos de infraestructura se marcan `@Global` para exponer sus _bindings_ sin que presentación importe infraestructura. Los imports usan extensión `.js` explícita (NodeNext).

## 5.3 Optimizer: contrato y CLIs

El optimizer expone `POST /solve?algorithm=cpsat|random|greedy`, recibiendo un `ProblemInput` y devolviendo un `SolverOutput`, ambos modelos **Pydantic** que fijan el contrato _wire_ (snake_case; categorías y días de la semana en minúsculas). Internamente, los módulos `solvers/`, `rule_compiler/` y `explainability.py` implementan el diseño del capítulo 4.

Dos CLIs comparten el mismo núcleo:

- `sprintwell-gen` genera instancias sintéticas reproducibles (por _seed_), con garantías de factibilidad por construcción (cobertura de skills, deadlines holgados, redundancia de portadores).
- `sprintwell-solve` resuelve una instancia desde archivo, con banderas `--algorithm`, `--seed`, `--equity-mode` y `--time-budget`, y códigos de salida por estado (0 factible, 1 infactible/timeout, 2/3 errores de entrada). El benchmark (capítulo 7) invoca esta CLI como subproceso, aislando la medición del backend.

El _tooling_ Python es `uv` (gestión de entorno y dependencias), `ruff` (E/F/I/N/UP/B/W, línea 100), `mypy --strict` y `pytest`.

## 5.4 Frontend: cliente tipado y estado

El frontend adopta un principio central: **no escribir tipos de la API a mano**. El backend exporta su OpenAPI a `shared/openapi.json` (`npm run openapi:export`, que arranca la app sin base de datos gracias a la conexión diferida de Prisma), y el frontend genera desde ahí un cliente tipado con `openapi-typescript` + `openapi-fetch` (`npm run generate:api`). CI verifica en ambos lados que el _spec_ y el cliente están regenerados (drift-check determinista). Habilitar el _plugin_ de `@nestjs/swagger` hace que el _spec_ derive los esquemas de _request_ automáticamente desde las clases DTO; las respuestas de lectura se tipan anotando cada endpoint con `@ApiOkResponse`.

El estado de sesión vive en un _store_ **Zustand** con persistencia en `localStorage` (login, logout, JWT); un _middleware_ de `openapi-fetch` inyecta el _bearer token_ en cada petición. El enrutado (React Router v7) monta las pantallas bajo un _layout_ con navegación condicional por rol y _guards_ (`RequireAuth`, `RequireAdmin`) que reflejan —a nivel de UX— la seguridad que imponen los _guards_ del backend. Las pantallas cubren los tres perfiles: lectura pública (listado y detalle de sprints, vista de planificación con Gantt y dashboard de bienestar, comparador de corridas), miembro (mis tareas, editor de reglas con presupuesto en vivo) y admin (equipo, skills, backlog, reglas de cualquier miembro, lanzar planificación).

El _tooling_ frontend es Vite, ESLint (flat config, `--max-warnings 0`), Prettier, `tsc` estricto, **vitest** (unit) y **Playwright** (e2e de los flujos críticos, con el backend mockeado por interceptación de rutas).

## 5.5 Persistencia

PostgreSQL vía Prisma. El `PrismaService` es **perezoso** (no conecta al arrancar), lo que permite instanciar la app sin base de datos para exportar el OpenAPI o correr los e2e DB-free en CI. Los agregados con estructura variable (asignaciones, felicidad por usuario, evaluaciones de reglas del `PlanningRun`) se persisten en columnas `Json`. Las asignaciones producidas por una planificación viven en el agregado `Sprint`/`PlanningRun`, lo que permite reconstruir "mis tareas" de un miembro recorriendo las corridas.

## 5.6 Desviaciones del diseño teórico

Se documentan honestamente los puntos donde la implementación se aparta del modelo o de una versión ideal:

1. **Agregación de equidad absoluta.** Como formaliza la Observación 3.1, el objetivo de equidad agrega los términos absolutos $\tilde f_j$ en vez del $f_j$ normalizado, por tratabilidad lineal en CP-SAT. Coinciden si todos agotan el presupuesto de 100; divergen si no.
2. **`rule_evaluations` no persistidas.** El `SolverOutput` del optimizer incluye las evaluaciones por regla, pero el backend no las persiste todavía en el `PlanningRun` (la columna `Json` existe, reservada). En consecuencia, el panel de explicabilidad del frontend explica vía el conjunto de reglas del miembro y su `f_j`, no vía el flag satisfecho/no por regla. Es un _follow-up_ acotado (sin migración).
3. **Sin catálogo de skills para miembros.** No hay endpoint de skills accesible a un miembro (solo admin), así que el editor de reglas introduce `skill_id` como texto libre en las reglas de skill. Un catálogo consultable por miembros queda como mejora.
4. **Endpoints completados durante la integración.** Dos piezas del backend que existían a nivel de caso de uso pero no estaban expuestas por HTTP se cablearon al integrar el frontend: el **endpoint de login** (`POST /auth/login`, sobre el `LoginUseCase` existente) y el **listado de "mis tareas"** (`GET /me/tasks`). Ambos se descubrieron por dependencia del frontend y se cerraron con sus tests.

Estas desviaciones no comprometen las hipótesis: H1 (cobertura del DSL) y H2 (rendimiento del solver) se sostienen sobre el núcleo del optimizer, intacto; H3 (metodología) se beneficia, de hecho, de que estas desviaciones estén documentadas y trazadas a _commits_ concretos.

## 5.7 Resumen

El sistema implementado es un producto end-to-end coherente: un backend DDD con fronteras verificadas por _lint_, un optimizer sin estado con contrato Pydantic y CLIs reutilizables, y un frontend con tipado derivado del backend y e2e de los flujos críticos. Las desviaciones respecto al diseño están declaradas y acotadas. El capítulo 6 documenta cómo se construyó; el capítulo 7, cómo se validó.
