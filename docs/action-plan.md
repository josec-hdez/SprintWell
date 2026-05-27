# SprintWell — Plan de acción en historias de usuario

> Plan operativo para llevar la tesis del Máster desde cero hasta defensa, basado en el `sprintwell-brief.md` y las decisiones tomadas en conversación. Este documento es el "qué hacer". El brief es el "qué construir". Si chocan, manda el brief.

---

## Convenciones de lectura

- El **usuario** de estas historias es el tesista (yo, Jose Carlos).
- Formato: **Como tesista, quiero X, para lograr Y.** Seguido de **criterios de aceptación** verificables.
- Las historias están agrupadas por **epics**, y los epics por **semana** del cronograma de 12 semanas.
- Cada historia tiene una etiqueta de prioridad:
    - 🔴 **Bloqueante**: si no se cierra esta semana, peligra el cronograma.
    - 🟡 **Importante**: hay que hacerla, puede deslizar un poco.
    - 🟢 **Deseable**: si hay tiempo. Se sacrifica primero.
- Dependencias explícitas con la notación `→ depende de #ID`.

---

## Sprint 0 — Antes de la semana 1 (preparación)

### Epic 0.1 — Cerrar materiales de partida

**H-0.1.1** 🔴 Como tesista, quiero **archivar el brief y este plan en Obsidian y en el repo** para tener una única fuente de verdad accesible desde ambos sitios.

- Carpeta `Master/SprintWell/` en Obsidian.
- Carpeta `docs/` del repo (a crear en H-1.1.1) con copias o enlaces simbólicos.
- Criterio de aceptación: ambos documentos abiertos desde Obsidian sin errores.

**H-0.1.2** 🔴 Como tesista, quiero **redactar los 5 wireframes en texto** (vista pública del sprint, editor de reglas, dashboard de bienestar, vista de explicabilidad, comparador de runs) para tener entradas estructuradas listas para Claude Design.

- Cada wireframe incluye layout ASCII, notas de comportamiento, estados a contemplar.
- Guardados en `docs/wireframes/` del repo.

**H-0.1.3** 🟡 Como tesista, quiero **validar la propuesta con mi tutor del máster** antes de empezar a programar para evitar reescrituras costosas.

- Enviar brief + este plan.
- Capturar feedback en un documento.
- Ajustar lo que indique antes de cerrar Sprint 0.

### Epic 0.2 — Herramientas listas

**H-0.2.1** 🔴 Como tesista, quiero **tener Claude Code, Claude Design, Obsidian y un IDE configurados** para no perder tiempo de desarrollo configurando entorno.

- Claude Code funcionando con `obsidian-mcp` activo.
- Claude Design accesible en `claude.ai/design`.
- IDE elegido (Cursor / WebStorm / VS Code) con plugins de TS y Python.

**H-0.2.2** 🔴 Como tesista, quiero **crear la bitácora metodológica vacía** para empezar a registrar desde el primer commit.

- Fichero `docs/methodology/log.md` en formato tabla.
- Columnas: fecha, duración, issue, herramienta IA, tipo de uso, prompt resumen, % aprovechado, defectos posteriores, observación.
- Plantilla de entrada documentada al inicio del fichero.

**H-0.2.3** 🟡 Como tesista, quiero **abrir un proyecto en Linear/GitHub Projects/Notion** para gestionar las historias de este plan como issues reales y poder hacer seguimiento.

- Cada historia de este plan = 1 issue.
- Vista de tablero por semanas / epics.

---

## Semana 1 — Setup y formalización

### Epic 1.1 — Monorepo y estructura

**H-1.1.1** 🔴 Como tesista, quiero **inicializar el monorepo con la estructura del brief (sección 14)** para tener el esqueleto listo desde el día 1.

- Subdirectorios: `backend/`, `frontend/`, `optimizer/`, `shared/`, `docs/`, `benchmarks/`.
- `README.md` raíz con instrucciones de bootstrap.
- `.gitignore`, `.editorconfig`, `LICENSE` (MIT o el que prefieras).

**H-1.1.2** 🔴 Como tesista, quiero **configurar Docker Compose con PostgreSQL** para tener BD reproducible.

- `docker-compose.yml` con servicio `postgres:16`.
- Variables de entorno en `.env.example`.
- Comando `make db-up` / `make db-reset` documentado.

**H-1.1.3** 🟡 Como tesista, quiero **un CI mínimo en GitHub Actions** que corra lint y tests para que el repo no degrade.

- Workflows para backend, frontend, optimizer.
- Lint + test en cada PR contra `main`.

### Epic 1.2 — Scaffolding backend NestJS con DDD

**H-1.2.1** 🔴 Como tesista, quiero **arrancar el proyecto NestJS** con la estructura de 4 capas DDD del brief (sección 14) para tener la disciplina arquitectónica desde el inicio.

- `backend/src/{domain,application,infrastructure,presentation}/` creadas.
- Cada capa con `shared/` y un contexto vacío de ejemplo.
- ESLint + reglas custom que bloqueen imports prohibidos entre capas (`eslint-plugin-boundaries` o similar).

**H-1.2.2** 🔴 Como tesista, quiero **implementar un "hello aggregate" end-to-end** atravesando las 4 capas para validar que el cableado DDD funciona antes de añadir lógica real.

- Caso de uso: `GetSystemHealthUseCase` (dominio trivial: `SystemHealth` value object con campos).
- Repositorio fake en infrastructure.
- Controller público `GET /health` que devuelve el resultado.
- Test e2e que recorre el flujo completo.

**H-1.2.3** 🟡 Como tesista, quiero **Prisma instalado con un schema vacío y una migración base** para poder añadir entidades incrementalmente.

- `prisma/schema.prisma` con datasource Postgres.
- Comando `pnpm prisma migrate dev` funcional.

### Epic 1.3 — Scaffolding optimizer Python

**H-1.3.1** 🔴 Como tesista, quiero **arrancar el microservicio FastAPI con OR-Tools instalado** para tener el lugar donde vivirá el solver.

- `optimizer/` con `pyproject.toml`, `uv` o `poetry` como gestor.
- FastAPI levantando en puerto definido.
- Endpoint `/health` que devuelve `{ "status": "ok" }`.
- `from ortools.sat.python import cp_model` importable.

**H-1.3.2** 🔴 Como tesista, quiero **definir los modelos Pydantic del payload del solver** para tener el contrato cerrado antes de implementarlo.

- `ProblemInput` (sprint, users, tasks, rules) y `SolverOutput` (assignments, métricas, evaluaciones).
- Test que valida un payload de ejemplo.

### Epic 1.4 — Scaffolding frontend

**H-1.4.1** 🟡 Como tesista, quiero **arrancar el frontend con Vite + React + TS + Tailwind + shadcn/ui** para no perder tiempo configurando UI más adelante.

- Página inicial vacía con un componente de shadcn renderizado.
- Routing con `react-router` listo.
- Cliente HTTP (axios o fetch wrapper) configurado.

### Epic 1.5 — Capítulo 3 de la memoria (formalización)

**H-1.5.1** 🟡 Como tesista, quiero **redactar la formalización matemática del problema en LaTeX** mientras el contexto está fresco, para no dejar la parte más densa de la memoria para el final.

- Variables de decisión, restricciones duras, función objetivo de los 3 modos de equidad.
- Justificación de NP-dificultad por reducción a GAP.
- Aprobado mentalmente cuando "explico esto en voz alta a una pared" sin lagunas.

**H-1.5.2** 🟢 Como tesista, quiero **redactar la introducción de la memoria** (capítulo 1) para tener el primer capítulo cerrado.

- Motivación, contexto, objetivos, estructura del documento.

---

## Semana 2 — Optimizador v1 (núcleo CP-SAT)

### Epic 2.1 — Modelo CP-SAT base

**H-2.1.1** 🔴 Como tesista, quiero **implementar las restricciones duras R1–R5** (asignación única, no solapamiento, horizonte, deadlines, dependencias) para tener un solver funcional sin reglas blandas todavía. → depende de H-1.3.2

- Función `build_base_model(problem)` que devuelve `(model, variables)`.
- Tests unitarios con 3 instancias de juguete (2 usuarios × 3 tareas, etc.).

**H-2.1.2** 🔴 Como tesista, quiero **una función objetivo trivial** (minimizar makespan o nulla) para que CP-SAT devuelva soluciones aunque sin preferencias. → depende de H-2.1.1

- Solver completa con `status = OPTIMAL` en las instancias de juguete.

**H-2.1.3** 🟡 Como tesista, quiero **manejar correctamente el estado `INFEASIBLE`** y devolver un mensaje legible. → depende de H-2.1.1

- Test con instancia infactible (deadline imposible) que verifica el manejo.

### Epic 2.2 — Skills (R6)

**H-2.2.1** 🔴 Como tesista, quiero **implementar el filtro de skill mínimo (R6)** para que las tareas solo se asignen a quien sabe hacerlas. → depende de H-2.1.1

- Test: instancia donde un usuario sin la skill no recibe la tarea.

### Epic 2.3 — Exposición del solver

**H-2.3.1** 🔴 Como tesista, quiero **endpoint `POST /solve` en FastAPI** que reciba el `ProblemInput` y devuelva `SolverOutput`. → depende de H-2.1.2

- Tiempo total medido y devuelto en `solver_stats`.
- Timeout configurable por parámetro (default 30 s).

**H-2.3.2** 🟡 Como tesista, quiero **un script CLI para invocar el solver desde fichero JSON** para poder probar manualmente. → depende de H-2.3.1

- `python -m optimizer.cli solve --input instance.json --out result.json`.

---

## Semana 3 — Optimizador v2 (reglas + baselines + generador)

### Epic 3.1 — Compilador de reglas

**H-3.1.1** 🔴 Como tesista, quiero **diseñar la interfaz `RuleCompiler`** con un método `compile(rule, model, vars) -> objective_term` para que cada tipo se añada de forma uniforme. → depende de H-2.1.1

- Patrón registro: cada tipo se registra en un diccionario `{type: compiler_fn}`.

**H-3.1.2** 🔴 Como tesista, quiero **implementar los compiladores de los 10 tipos** del DSL (sección 6.3 del brief). → depende de H-3.1.1

- Una sub-historia por tipo, con test unitario propio:
    - H-3.1.2a `PREFER_SKILL` / `AVOID_SKILL`
    - H-3.1.2b `PREFER_CATEGORY` / `AVOID_CATEGORY`
    - H-3.1.2c `PREFER_DOMAIN`
    - H-3.1.2d `PREFER_WEEKDAY` / `AVOID_WEEKDAY`
    - H-3.1.2e `BLACKOUT_DATE` (dura)
    - H-3.1.2f `MAX_TASKS_PER_SPRINT`
    - H-3.1.2g `FOCUS_PREFERENCE`
    - H-3.1.2h `COOLDOWN_AFTER`
    - H-3.1.2i `LEARN_SKILL`

**H-3.1.3** 🔴 Como tesista, quiero **agregación con los 3 modos de equidad** (utilitarista, max-min, Nash) en la función objetivo para poder comparar. → depende de H-3.1.2

- Parámetro `equity_mode` en el payload.
- Test: misma instancia, 3 modos, los resultados difieren consistentemente.

**H-3.1.4** 🔴 Como tesista, quiero **devolver `rule_evaluations`** por cada asignación para alimentar la explicabilidad. → depende de H-3.1.2

- Para cada regla blanda, devolver `{rule_id, satisfied, contribution}`.

### Epic 3.2 — Baselines

**H-3.2.1** 🔴 Como tesista, quiero **baseline aleatorio** que respete solo restricciones estructurales (asignación única, no solapamiento, deadlines, dependencias). → depende de H-2.1.1

- Endpoint `POST /solve?algorithm=random`.

**H-3.2.2** 🔴 Como tesista, quiero **baseline greedy por skill-match** que asigne sin considerar preferencias. → depende de H-2.1.1

- Endpoint `POST /solve?algorithm=greedy`.

### Epic 3.3 — Generador sintético

**H-3.3.1** 🔴 Como tesista, quiero **CLI `sprintwell-gen` parametrizable** que genere instancias del problema en JSON. → depende de H-1.3.2

- Parámetros: `--users`, `--tasks`, `--days`, `--skills`, `--rule-density`, `--conflict-density`, `--seed`, `--out`.
- Output JSON validado contra el schema Pydantic.

**H-3.3.2** 🟡 Como tesista, quiero **un set de 12 instancias predefinidas guardadas en `benchmarks/instances/`** que cubran las 4 escalas (5×30, 10×80, 20×150, 30×200) × 3 modos de equidad. → depende de H-3.3.1

- Generadas con seeds documentadas para reproducibilidad.

---

## Semana 4 — Backend v1 (identity, team, sprint con DDD)

### Epic 4.1 — Schema de datos

**H-4.1.1** 🔴 Como tesista, quiero **definir el schema Prisma completo** con todas las entidades del brief (User, Skill, Sprint, Task, Rule, PlanningRun, Assignment) y migrar. → depende de H-1.2.3

- Migración inicial generada y aplicada.
- Seed básico con un admin de ejemplo.

### Epic 4.2 — Contexto Identity

**H-4.2.1** 🔴 Como tesista, quiero **agregado `User` con value objects `Role` y `Credentials`** en `domain/identity/`. → depende de H-1.2.2

- Test unitario sobre invariantes (no contraseña vacía, rol válido, etc.).

**H-4.2.2** 🔴 Como tesista, quiero **`PrismaUserRepository`** que implemente la interfaz definida en domain. → depende de H-4.2.1, H-4.1.1

- Mapper Domain ↔ Persistence.
- Test de integración con DB real.

**H-4.2.3** 🔴 Como tesista, quiero **casos de uso de login y change-password** en `application/identity/`. → depende de H-4.2.2

- `LoginUseCase` valida credenciales, devuelve JWT.
- Hash con argon2.

**H-4.2.4** 🔴 Como tesista, quiero **`MemberGuard` y `AdminGuard`** en `presentation/guards/` para proteger endpoints. → depende de H-4.2.3

- Test e2e con tokens válidos / inválidos / de rol equivocado.

### Epic 4.3 — Contexto Team

**H-4.3.1** 🔴 Como tesista, quiero **agregado `Team` con `Skill` y `SkillLevel`** en `domain/team/`. → depende de H-1.2.2

- Invariantes: nivel entre 1 y 5, skill id único en el catálogo.

**H-4.3.2** 🔴 Como tesista, quiero **casos de uso de gestión de miembros y skills** (CRUD) en `application/team/`. → depende de H-4.3.1, H-4.2.2

**H-4.3.3** 🔴 Como tesista, quiero **controllers REST en `presentation/http/admin/team/`** para los CRUD. → depende de H-4.3.2, H-4.2.4

- DTOs con class-validator.
- OpenAPI generado.

### Epic 4.4 — Contexto Sprint

**H-4.4.1** 🔴 Como tesista, quiero **agregado `Sprint` con `Task`, `TaskStatus` y `Assignment`** en `domain/sprint/`. → depende de H-1.2.2

- Invariantes: `effort_days ≥ 1`, `start_day + effort_days ≤ duration`.
- Transiciones de estado válidas: TODO → IN_PROGRESS → DONE; cualquiera → BLOCKED → estado previo.

**H-4.4.2** 🔴 Como tesista, quiero **casos de uso CRUD de sprints y tareas** + `ChangeTaskStatusUseCase`. → depende de H-4.4.1, H-4.3.1

**H-4.4.3** 🔴 Como tesista, quiero **endpoints públicos (lectura) y de admin (CRUD)** de sprints y tareas. → depende de H-4.4.2, H-4.2.4

- `GET /sprints` y `GET /sprints/:id` sin auth.
- POST/PUT/DELETE solo admin.

**H-4.4.4** 🔴 Como tesista, quiero **endpoint de miembro `PATCH /tasks/:id/status`** que valide que el miembro autenticado es el asignado a la tarea. → depende de H-4.4.3

- Test: miembro intenta cambiar el estado de tarea ajena → 403.

---

## Semana 5 — Backend v2 (rules, planning, integración con optimizador)

### Epic 5.1 — Contexto Rules

**H-5.1.1** 🔴 Como tesista, quiero **agregado `RuleSet` y entidad `Rule`** con value objects `Weight` y `RuleType` en `domain/rules/`. → depende de H-4.2.1

- Invariante: suma de pesos de reglas blandas habilitadas ≤ 100.
- Reglas duras no consumen presupuesto.

**H-5.1.2** 🔴 Como tesista, quiero **JSON Schema fuente en `shared/rule-schemas/`** consumido por backend (Zod) y optimizer (Pydantic). → depende de H-5.1.1

- Un schema por tipo, validado en ambos lados.

**H-5.1.3** 🔴 Como tesista, quiero **validador de conflictos del RuleSet** en `domain/rules/policies/`. → depende de H-5.1.1

- Detecta pares antagónicos (PREFER+AVOID del mismo target).
- Devuelve lista de conflictos con descripciones.

**H-5.1.4** 🔴 Como tesista, quiero **casos de uso de gestión de reglas** en `application/rules/`. → depende de H-5.1.3, H-4.2.2

- Miembro edita las suyas; admin edita las de cualquiera.

**H-5.1.5** 🔴 Como tesista, quiero **endpoints REST de reglas** en `presentation/http/member/` y `presentation/http/admin/`. → depende de H-5.1.4

- Validación contra JSON Schema antes de aceptar.

### Epic 5.2 — Contexto Planning

**H-5.2.1** 🔴 Como tesista, quiero **agregado `PlanningRun`** con `PlanningStrategy` y `HappinessScore` en `domain/planning/`. → depende de H-4.4.1, H-5.1.1

- Inmutable una vez creado.

**H-5.2.2** 🔴 Como tesista, quiero **cliente HTTP del optimizador** en `infrastructure/optimizer/` con adaptador del payload Domain → ProblemInput. → depende de H-3.1.3, H-5.2.1

- Manejo de timeout, error de conexión, status INFEASIBLE.

**H-5.2.3** 🔴 Como tesista, quiero **`LaunchPlanningUseCase`** que orqueste: leer sprint + reglas → llamar optimizer → guardar PlanningRun. → depende de H-5.2.2

- Test de integración con optimizer real (en docker compose de test).

**H-5.2.4** 🔴 Como tesista, quiero **endpoints de planning** en `presentation/http/admin/`. → depende de H-5.2.3

- `POST /sprints/:id/planning-runs` con `{ algorithm, equity_mode }`.
- `GET /planning-runs/:id` público.
- `GET /sprints/:id/planning-runs` público (listado).

---

## Semana 6 — Frontend v1 (vista pública + auth)

### Epic 6.1 — Infraestructura frontend

**H-6.1.1** 🔴 Como tesista, quiero **layout base con header y navegación condicional por rol**. → depende de H-1.4.1

- Header muestra "Login" si anónimo, nombre + menú si autenticado.

**H-6.1.2** 🔴 Como tesista, quiero **cliente API tipado generado desde el OpenAPI del backend** para no escribir wrappers a mano. → depende de H-4.4.3

- Tool: `openapi-typescript` o equivalente.
- Re-generado en CI cuando cambia el OpenAPI.

**H-6.1.3** 🔴 Como tesista, quiero **store de auth** (Zustand o Context) con login, logout, persistencia del JWT. → depende de H-6.1.2, H-4.2.3

### Epic 6.2 — Pantalla de login

**H-6.2.1** 🟡 Como tesista, quiero **prototipar la pantalla de login en Claude Design** y traer el resultado a Claude Code. → depende de H-0.1.2

- Formulario sencillo: usuario + contraseña + botón.

**H-6.2.2** 🔴 Como tesista, quiero **pantalla de login funcional** que use el `LoginUseCase` del backend. → depende de H-6.2.1, H-6.1.3

### Epic 6.3 — Vista pública

**H-6.3.1** 🟡 Como tesista, quiero **el wireframe de "vista pública del sprint" prototipado en Claude Design**. → depende de H-0.1.2

**H-6.3.2** 🔴 Como tesista, quiero **listado de sprints** accesible sin login. → depende de H-6.1.2, H-4.4.3

**H-6.3.3** 🔴 Como tesista, quiero **vista detalle del sprint** con sus tareas en formato tabla/lista. → depende de H-6.3.2

---

## Semana 7 — Frontend v2 (gestión + reglas)

### Epic 7.1 — CRUD admin

**H-7.1.1** 🔴 Como tesista, quiero **pantallas admin de gestión de miembros y skills**. → depende de H-4.3.3, H-6.3.1

- Tablas con paginación, modales de edición.

**H-7.1.2** 🔴 Como tesista, quiero **pantallas admin de gestión de sprints y tareas**. → depende de H-4.4.3, H-7.1.1

### Epic 7.2 — Cambio de estado de tareas (miembro)

**H-7.2.1** 🔴 Como tesista, quiero **vista "mis tareas"** para el miembro autenticado, con selector de estado. → depende de H-4.4.4, H-6.1.3

- Lista de tareas asignadas al miembro en el sprint activo.
- Dropdown para cambiar estado con confirmación.

### Epic 7.3 — Editor de reglas

**H-7.3.1** 🟡 Como tesista, quiero **el wireframe del editor de reglas prototipado en Claude Design**. → depende de H-0.1.2

**H-7.3.2** 🔴 Como tesista, quiero **editor de reglas para el miembro** con reparto de presupuesto en vivo y detección de conflictos. → depende de H-7.3.1, H-5.1.5

- Barra de presupuesto 0/100 actualizada en tiempo real.
- Banner de conflictos al detectar.
- Modal para añadir regla con selector de tipo y campos dinámicos según tipo.

**H-7.3.3** 🟡 Como tesista, quiero **vista admin de reglas de cualquier miembro** para resolver bloqueos. → depende de H-7.3.2

---

## Semana 8 — Frontend v3 (planificación + visualización)

### Epic 8.1 — Lanzamiento de planificación

**H-8.1.1** 🔴 Como tesista, quiero **botón "planificar sprint"** en el detalle del sprint (admin) con selector de algoritmo y modo de equidad. → depende de H-5.2.4, H-7.1.2

- Spinner mientras corre el solver.
- Manejo de error y de status `INFEASIBLE` con mensaje claro.

### Epic 8.2 — Visualización del PlanningRun

**H-8.2.1** 🟡 Como tesista, quiero **el wireframe del dashboard de bienestar prototipado en Claude Design**. → depende de H-0.1.2

**H-8.2.2** 🔴 Como tesista, quiero **vista Gantt/calendario** del PlanningRun mostrando asignaciones por persona y día, con colores por status de tarea. → depende de H-8.1.1, H-8.2.1

- Librería: `react-gantt-task` o implementación propia con CSS grid.
- Tooltip por celda con resumen de la tarea.

**H-8.2.3** 🔴 Como tesista, quiero **dashboard de bienestar** con barras de felicidad por persona y métricas globales (media, min, max, % reglas blandas satisfechas). → depende de H-8.2.2

- Visualización con Recharts o similar.

---

## Semana 9 — Explicabilidad + comparador

### Epic 9.1 — Explicabilidad por asignación

**H-9.1.1** 🟡 Como tesista, quiero **el wireframe de explicabilidad prototipado**. → depende de H-0.1.2

**H-9.1.2** 🔴 Como tesista, quiero **panel lateral o modal** que muestre, al pinchar una asignación: reglas del usuario satisfechas, violadas, contribución de cada una. → depende de H-9.1.1, H-8.2.2

- Renderizado a partir de `rule_evaluations` del PlanningRun.

### Epic 9.2 — Comparador de PlanningRuns

**H-9.2.1** 🟡 Como tesista, quiero **el wireframe del comparador prototipado**. → depende de H-0.1.2

**H-9.2.2** 🔴 Como tesista, quiero **vista lado a lado** de dos PlanningRuns del mismo sprint. → depende de H-9.2.1, H-8.2.3

- Diff de asignaciones (qué cambió).
- Diff de métricas globales.

### Epic 9.3 — Robustez

**H-9.3.1** 🟡 Como tesista, quiero **tests e2e con Playwright** de los flujos críticos. → depende de todo lo anterior

- Login, crear regla, lanzar planificación, ver resultado, cambiar estado de tarea.

**H-9.3.2** 🟢 Como tesista, quiero **pulido visual con shadcn** (espaciados, iconos, estados de carga consistentes) para que las capturas de la memoria luzcan profesionales.

---

## Semana 10 — Benchmark

### Epic 10.1 — Ejecución del benchmark

**H-10.1.1** 🔴 Como tesista, quiero **script que ejecute las 12 instancias × 3 algoritmos × 3 modos de equidad × 10 seeds** y guarde los resultados en CSV. → depende de H-3.3.2, H-5.2.4

- Ejecutado vía CLI del optimizer directamente, sin pasar por backend.
- Output `benchmarks/results/raw.csv`.

**H-10.1.2** 🔴 Como tesista, quiero **notebook de análisis** que produzca gráficas de tiempo, valor objetivo, felicidad media/min/max por configuración. → depende de H-10.1.1

- `benchmarks/notebooks/analysis.ipynb` con matplotlib.
- Gráficas exportadas a `benchmarks/results/figures/` en PNG y PDF.

**H-10.1.3** 🟡 Como tesista, quiero **caso de estudio "semi-realista"** con un equipo ficticio creíble (10 personas con bios, skills, reglas plausibles). → depende de H-10.1.2

- Resultados narrados cualitativamente.

---

## Semana 11 — Memoria, parte I

### Epic 11.1 — Capítulos 1–4

**H-11.1.1** 🔴 Como tesista, quiero **el capítulo 1 (introducción) cerrado**. → depende de H-1.5.2

- Motivación, contexto, hipótesis, objetivos, estructura.

**H-11.1.2** 🔴 Como tesista, quiero **el capítulo 2 (estado del arte) cerrado**.

- Herramientas comerciales (Jira, Linear), employee scheduling, preference-aware optimization, desarrollo asistido por IA.
- Mínimo 25 referencias bibliográficas.

**H-11.1.3** 🔴 Como tesista, quiero **el capítulo 3 (modelo formal) cerrado**. → depende de H-1.5.1

- Refinado con lo aprendido durante la implementación.

**H-11.1.4** 🔴 Como tesista, quiero **el capítulo 4 (diseño algorítmico) cerrado**.

- CP-SAT, baselines, equidad, tratamiento de reglas.

---

## Semana 12 — Memoria, parte II + defensa

### Epic 12.1 — Capítulos 5–9

**H-12.1.1** 🔴 Como tesista, quiero **el capítulo 5 (sistema implementado) cerrado**.

- Arquitectura, capas DDD, decisiones técnicas, capturas.

**H-12.1.2** 🔴 Como tesista, quiero **el capítulo 6 (metodología IA) cerrado**. → depende de la bitácora completa

- Análisis cuantitativo de la bitácora.
- Patrones de prompting que funcionaron.
- Casos donde la IA aceleró / introdujo deuda.
- Conjunto de buenas prácticas como output.

**H-12.1.3** 🔴 Como tesista, quiero **el capítulo 7 (validación y resultados) cerrado**. → depende de H-10.1.2, H-10.1.3

- Tablas y gráficas del benchmark.
- Discusión del caso de estudio.

**H-12.1.4** 🔴 Como tesista, quiero **el capítulo 8 (discusión, ética, limitaciones) cerrado**.

- Riesgos éticos de medir felicidad: consentimiento, asimetrías de poder, visibilidad de reglas.
- Limitaciones reconocidas: no validación con usuarios reales, escala limitada del benchmark, modelo de cumplimiento simplificado.

**H-12.1.5** 🔴 Como tesista, quiero **el capítulo 9 (conclusiones y trabajo futuro) cerrado**.

- Recapitulación de aportes.
- Trabajo futuro: ILP como baseline, metaheurísticas, NLP de reglas, validación con usuarios, renegociación dinámica.

### Epic 12.2 — Defensa

**H-12.2.1** 🔴 Como tesista, quiero **presentación de 15–20 minutos** con narrativa clara. → depende de H-12.1.*

- Estructura: problema → propuesta → cómo lo construí (énfasis en IA) → resultados → demo.
- Slides en Claude Design o similar.

**H-12.2.2** 🔴 Como tesista, quiero **demo en vivo del sistema** funcionando localmente, ensayada. → depende de H-9.3.1

- Script de demo: login admin → ver sprint → lanzar planificación → mostrar dashboard → mostrar explicabilidad → cambiar a otro modo de equidad → comparar.
- Fallback: vídeo grabado por si falla el live.

**H-12.2.3** 🔴 Como tesista, quiero **ensayar la defensa al menos 3 veces**, incluyendo Q&A simulada.

- Lista de preguntas anticipadas (NP-dificultad, validez de la métrica de felicidad, equidad, ética, uso de IA).

---

## Anexos transversales

Estas historias no van en una semana concreta porque son **continuas**:

**H-T.1** 🔴 Como tesista, quiero **actualizar la bitácora metodológica al final de cada sesión de trabajo** (≥ 15 min). → depende de H-0.2.2

- No negociable. Es la materia prima del capítulo 6.

**H-T.2** 🟡 Como tesista, quiero **revisar la bitácora cada viernes** y anotar observaciones de la semana.

- Patrones que veo emerger, herramientas que funcionan, fricciones.

**H-T.3** 🟡 Como tesista, quiero **crear un ADR (Architecture Decision Record)** cada vez que tome una decisión técnica no trivial.

- Formato: contexto, decisión, alternativas consideradas, consecuencias.
- En `docs/adr/NNN-titulo.md`.

**H-T.4** 🟢 Como tesista, quiero **commits con mensajes en formato convencional** (`feat:`, `fix:`, `docs:`) para tener un historial legible que pueda citar en la memoria.

**H-T.5** 🔴 Como tesista, quiero **revisar el progreso vs. el plan cada viernes** (15 min).

- ¿Voy en plazo?
- ¿Qué historia se cae al cubo de "trabajo futuro" si voy retrasado?
- ¿Qué hay que ajustar en el plan?

---

## Reglas de cordura

1. **Si una semana se desliza, el alcance se recorta, no el plazo.** El cronograma de 12 semanas es duro. Antes de extender, sacrifica historias 🟢 y luego 🟡.
2. **Producto > pulido.** Una pantalla fea pero funcional vale más que una bonita a medio terminar. Tienes 5 wireframes en Claude Design para evitar perder tiempo en exploraciones visuales tardías.
3. **Memoria en paralelo, no al final.** Las semanas 11–12 son redacción, pero hay material para ir capturando desde la semana 1 (capítulo 3 formalización, ADRs, capturas, bitácora). No las dejes vacías hasta el final.
4. **No tocar las decisiones cerradas** (sección 17 del brief) sin actualizar el brief primero. Cualquier replanteamiento empieza por modificar el brief, no por reescribir código.
5. **Cuando dudes entre dos caminos, elige el que más material genera para la memoria.** Una decisión técnica que rinde dos páginas de discusión es mejor que la "correcta" que rinde un párrafo.

---

## Lo primero que tienes que hacer ahora

En este orden:

1. H-0.1.1 — Guardar brief + este plan en Obsidian.
2. H-0.2.2 — Crear bitácora vacía con plantilla.
3. H-0.1.2 — Redactar los 5 wireframes (puedes empezar pidiéndomelo).
4. H-0.2.3 — Crear el tablero de gestión con las historias.
5. H-0.1.3 — Validar con tutor antes de seguir.

Cuando termines esos 5 puntos, estás listo para abrir la semana 1.