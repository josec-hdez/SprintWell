# SprintWell

> Trabajo Fin de Máster: **"Planificación de sprints con asignación de tareas multiobjetivo orientada al bienestar del equipo, desarrollada mediante metodologías asistidas por IA"**.

**SprintWell** es un sistema web de planificación de sprints que incorpora las **preferencias individuales del trabajador** (tipo de tarea, días, dominios de interés, guardias, intención de aprender) como un objetivo de primer orden, junto a las restricciones operativas clásicas (capacidad, dependencias, deadlines, skills) y a criterios de equidad inter-empleado.

El problema se formaliza como una optimización combinatoria multiobjetivo (NP-difícil, reducible al _Generalized Assignment Problem_) y se aborda con una formulación **CP-SAT**, documentando rigurosamente el uso de herramientas de IA en todas las fases del desarrollo.

---

## 📌 Fuente única de verdad

El **brief técnico** es el documento maestro del proyecto: gobierna el alcance, la arquitectura y la generación de _issues_.

> **Cualquier cambio de alcance se hace PRIMERO en el brief y luego se implementa, no al revés.** Si el plan de acción y el brief chocan, **manda el brief**.

| Documento | Rol | Ubicación |
|---|---|---|
| [`docs/sprintwell-brief.md`](docs/sprintwell-brief.md) | **Brief técnico** — qué construir (SSOT) | Repo + Obsidian `Local/TFM/SprintWell.md` |
| [`docs/action-plan.md`](docs/action-plan.md) | **Plan de acción** — qué hacer (12 semanas en historias) | Repo + Obsidian `Local/TFM/Action Plan.md` |

Ambos documentos se mantienen versionados en este repositorio y editables desde Obsidian; el repo es la copia de referencia para detectar divergencias en el control de versiones.

---

## Objetivos

1. **Dominio:** modelo formal y sistema funcional para incorporar preferencias del trabajador a la planificación de sprints, con tratamiento explícito de la equidad.
2. **Algorítmico:** estudio de la formulación CP-SAT del problema con benchmark sintético reproducible y comparación frente a _baselines_ triviales.
3. **Metodológico:** protocolo documentado y métricas reales sobre el uso de IA en el desarrollo de un sistema no trivial por un único desarrollador.

Hipótesis falseables, aportes esperados y exclusiones de alcance: ver [§2 del brief](docs/sprintwell-brief.md#2-objetivos-del-proyecto).

---

## Cómo navegar la documentación

- **¿Qué construir?** → [`docs/sprintwell-brief.md`](docs/sprintwell-brief.md): arquitectura (§4), modelo de dominio (§5), DSL de reglas (§6), formulación matemática (§7), algoritmos (§8) y Definition of Done (§16).
- **¿Qué hacer y cuándo?** → [`docs/action-plan.md`](docs/action-plan.md): cronograma de 12 semanas desglosado en historias de usuario, base del backlog de _issues_.

---

## Estado

Sprint 0 — Preparación. El backlog vive como _issues_ de GitHub derivados del plan de acción.

## Licencia

Ver [LICENSE](LICENSE).

---

## Getting started

> This section is in English per brief §3 (code and technical docs in English; the final memoria is in Spanish).

SprintWell is a monorepo with three services plus shared and documentation areas. The skeleton mirrors brief §14; per-service tooling is bootstrapped in later week-1 issues.

### Repository layout

| Directory | Holds | Stack |
|---|---|---|
| `backend/` | NestJS REST API, structured as DDD in 4 layers (`domain`, `application`, `infrastructure`, `presentation`). Layer dependency rules in brief §14.1. | NestJS + TypeScript + Prisma |
| `frontend/` | Single-page web app: public read-only views plus member/admin flows. | React + TypeScript + Vite + Tailwind + shadcn/ui |
| `optimizer/` | Standalone solver microservice (CP-SAT + baselines) and the synthetic dataset CLI generator. | Python 3.11 + OR-Tools + FastAPI |
| `shared/` | Cross-service source of truth — `rule-schemas/` JSON Schema consumed by both backend and optimizer. | JSON Schema |
| `docs/` | Technical brief (SSOT), action plan, wireframes, thesis (LaTeX), methodology log, and ADRs. | Markdown / LaTeX |
| `benchmarks/` | Reproducible benchmark: instances, results, and analysis notebooks. | JSON / Jupyter |

Each directory carries a short `README.md` describing its purpose and the rules that apply to it.

### Prerequisites (planned)

- Node.js (LTS) and a package manager — for `backend/` and `frontend/`.
- Python 3.11 — for `optimizer/`.
- Docker + Docker Compose — for PostgreSQL 16 and orchestrating the services.

### Status

This issue bootstraps the monorepo skeleton, the editor configuration (`.editorconfig`), and the ignore rules (`.gitignore`). Per-service manifests (`package.json`, `pyproject.toml`, `tsconfig.json`, Prisma schema, `docker-compose.yml`) and runnable code are added in subsequent week-1 issues.
