# SprintWell

> **Trabajo Fin de Máster — Máster de Desarrollo con IA.**
> Planificación de sprints con asignación de tareas multiobjetivo orientada al **bienestar del equipo**, desarrollada con metodologías asistidas por IA.

**SprintWell** es un sistema web que planifica sprints incorporando las **preferencias individuales de cada persona** (tipo de tarea, días, dominios, guardias, intención de aprender) como un **objetivo de primer orden**, junto a las restricciones operativas clásicas (capacidad, dependencias, deadlines, skills) y a criterios de **equidad** inter-empleado seleccionables (utilitarista, max-min, Nash).

El problema se formaliza como una optimización combinatoria multiobjetivo (NP-difícil, reducible al _Generalized Assignment Problem_) y se resuelve con **CP-SAT** (OR-Tools), comparándolo contra baselines. Todo el desarrollo está documentado como bitácora de uso de IA.

---

## 🔗 Enlaces de entrega

| Recurso | Enlace |
|---|---|
| **Repositorio (público)** | https://github.com/josec-hdez/SprintWell |
| **Despliegue** | _Local (ver [Instalación y ejecución](#-instalación-y-ejecución)). Sin despliegue público por ahora._ |
| **Slides** | **[Presentación (Google Drive)](https://drive.google.com/file/d/1KOJx-FMoyxw9CXwl0tP-0jR2mtXZzWtO/view)** · en el repo: [`docs/defense/slides-v2.pdf`](docs/defense/slides-v2.pdf) · fuente [`slides-v2.md`](docs/defense/slides-v2.md) (Marp) · guion [`presentation.md`](docs/defense/presentation.md) |
| **Vídeo** | _Pendiente de grabar (guion detallado toma por toma en [`docs/defense/video-script-v2.md`](docs/defense/video-script-v2.md))_ |

> Los tres últimos son entregables que requieren un paso manual (desplegar, exportar las slides, grabar el vídeo). Este README se actualiza con sus URLs públicas cuando existan.

---

## 🔑 Usuario y contraseña de prueba

Tras ejecutar el seed (`npm run prisma:seed`, ver abajo):

| Rol | Usuario | Contraseña |
|---|---|---|
| **Admin** | `admin@sprintwell.local` | `changeme` |
| **Miembro** | `ana@sprintwell.local` (o `beto@`, `carla@`, `diego@`, `elena@`, `faruk@`, `gabi@`, `hugo@` `@sprintwell.local`) | `changeme` |

---

## 🧩 Stack tecnológico

| Servicio | Tecnologías |
|---|---|
| **Backend** (`backend/`) | NestJS 11 · TypeScript (DDD en 4 capas) · Prisma 6 · PostgreSQL 16 · JWT + argon2 · Jest |
| **Optimizer** (`optimizer/`) | Python 3.11 · FastAPI · OR-Tools **CP-SAT** · Pydantic · `uv` · pytest · ruff · mypy |
| **Frontend** (`frontend/`) | React 19 · Vite 6 · TypeScript · Tailwind v4 · shadcn/ui · React Router 7 · Zustand · cliente tipado generado desde el OpenAPI (`openapi-typescript` + `openapi-fetch`) · Vitest · Playwright |
| **Compartido / infra** | JSON Schema (`shared/`) · Docker Compose (PostgreSQL) · GitHub Actions (CI por servicio) |

---

## ⚙️ Instalación y ejecución

**Prerrequisitos:** Docker (Compose v2), Node ≥ 20 + npm, Python 3.11 + [`uv`](https://docs.astral.sh/uv/). Se arrancan 4 piezas en este orden.

```bash
# 1) Base de datos (PostgreSQL 16 en Docker)
make db-up                    # = docker compose up -d postgres

# 2) Optimizer  (http://localhost:8000)
cd optimizer
uv sync
uv run uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
#    verificar:  curl http://localhost:8000/health  → {"status":"ok"}

# 3) Backend  (http://localhost:3000 · Swagger en /docs)
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed           # crea admin + equipo + sprint de demo
npm run start:dev

# 4) Frontend  (http://localhost:5173)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abre **http://localhost:5173** e inicia sesión con las credenciales de arriba. El seed deja listo el sprint **"Apollo — Sprint 14"** con equipo, skills, tareas y reglas: como admin, ve a **Backlog → Plan** para lanzar una planificación.

### Opción B — todo en contenedores (un solo comando)

Levanta los **cuatro servicios** (postgres + optimizer + backend + frontend) con Docker, sin instalar Node ni Python en la máquina:

```bash
docker compose -f docker-compose.full.yml up --build
# una vez arriba, sembrar los datos de demo (una sola vez):
docker compose -f docker-compose.full.yml exec backend \
  node dist/infrastructure/persistence/prisma/seed.js
```

- **Frontend:** http://localhost:5173 · **API:** http://localhost:3000/docs · **Optimizer:** http://localhost:8000/health
- El backend aplica las migraciones al arrancar; postgres conserva los datos en un volumen.
- Este compose es también la base para desplegar en cualquier _host_ de contenedores (Railway, Render, Fly.io…). El frontend hornea `VITE_API_URL` en tiempo de build (arg de Docker): apúntalo a la URL pública del backend al desplegar.

---

## ✨ Funcionalidades principales

**Público (sin login):**
- Listado y detalle de sprints con su tabla de tareas.
- Vista de una planificación: **Gantt** por persona/día, **dashboard de bienestar** (felicidad media/mín/máx + barra por persona) y **panel de explicabilidad**.
- **Comparador** de dos planificaciones del mismo sprint (diff de métricas y de asignaciones).

**Miembro:**
- **Mis tareas** con cambio de estado (con confirmación).
- **Editor de reglas** con DSL de 12 tipos, **presupuesto de 100 puntos en vivo** y detección de conflictos.

**Admin:**
- Gestión de **equipo** (miembros + skills con nivel) y del **backlog** (sprints y tareas con dependencias, deadlines y skills).
- Edición de reglas de **cualquier** miembro.
- **Lanzar planificación** eligiendo algoritmo (CP-SAT / random / greedy) y modo de equidad (utilitarista / max-min / Nash).

**Motor / algoritmia:**
- Optimizador CP-SAT con _rule compiler_ del DSL, 3 modos de equidad y 2 baselines.
- Generador de instancias sintéticas y **benchmark reproducible** (`benchmarks/`).

---

## 📁 Estructura del proyecto

```
SprintWell/
├── backend/       API NestJS (DDD: domain, application, infrastructure, presentation) + Prisma
├── optimizer/     Microservicio Python FastAPI + OR-Tools CP-SAT (+ CLIs solve/gen)
├── frontend/      SPA React (Vite + Tailwind + shadcn) con cliente tipado
├── shared/        Contratos entre servicios: JSON Schema de reglas + openapi.json
├── benchmarks/    Instancias fijas, script de benchmark, notebook de análisis, caso de estudio
├── docs/          Brief técnico (SSOT), memoria (thesis/), caso de estudio, defensa, ADRs
├── docker-compose.yml   PostgreSQL 16
└── Makefile             atajos de BD (make db-up / db-down / db-reset)
```

Cada servicio tiene su propio `README.md` con detalle de tooling y comandos.

---

## 🧪 Tests y calidad

- **Backend:** `npm test` (unit) · `npm run test:e2e` (e2e sin BD) · `eslint` con fronteras de capa (`eslint-plugin-boundaries`).
- **Optimizer:** `uv run pytest` · `ruff` · `mypy --strict`.
- **Frontend:** `npm run test:run` (Vitest) · `npm run test:e2e` (Playwright, flujos críticos) · `tsc` estricto · ESLint.
- **CI:** GitHub Actions ejecuta lint + tests por servicio en cada PR; el cliente tipado y el OpenAPI se verifican regenerados (drift-check).

---

## 📚 Documentación

- **Brief técnico (fuente única de verdad):** [`docs/sprintwell-brief.md`](docs/sprintwell-brief.md)
- **Memoria del TFM (9 capítulos):** [`docs/thesis/chapters/`](docs/thesis/chapters/)
- **Caso de estudio (equipo Apollo):** [`docs/case-study/`](docs/case-study/)
- **Preparación de la defensa (slides, guion de demo, Q&A):** [`docs/defense/`](docs/defense/)

## Licencia

Ver [LICENSE](LICENSE).
