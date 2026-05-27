# SprintWell — Brief técnico del proyecto

> Documento maestro para guiar la implementación del Trabajo Fin de Máster: **"Planificación de sprints con asignación de tareas multiobjetivo orientada al bienestar del equipo, desarrollada mediante metodologías asistidas por IA"**.
> 
> Este documento es la fuente única de verdad para sacar _issues_ y diseñar la arquitectura. Cualquier decisión que contradiga esto debe modificar primero este documento.

---

## 1. Contexto y motivación

Las herramientas actuales de planificación de proyectos software (Jira, ClickUp, Linear, Asana) optimizan implícita o explícitamente por criterios operativos: capacidad, dependencias, prioridad de negocio y, como mucho, _skill match_. Las **preferencias individuales del trabajador** —tipo de tarea, días de la semana, dominios de interés, modalidades de guardia, intención de aprender nuevas tecnologías— quedan fuera del modelo formal y, cuando se atienden, se hace de manera ad-hoc por parte del _team lead_.

**SprintWell** propone un sistema de planificación de sprints que incorpora un modelo formal de preferencias del trabajador como un objetivo de primer orden, junto a las restricciones operativas clásicas. La asignación óptima resultante es un problema **NP-difícil** (reducible al _Generalized Assignment Problem_ con restricciones adicionales), lo que justifica un estudio comparativo de enfoques.

---

## 2. Objetivos del proyecto

### 2.1 Objetivo general

Diseñar, implementar y validar un sistema web de planificación de sprints que optimice la asignación de tareas considerando simultáneamente:

1. Las restricciones operativas del equipo (capacidad, dependencias, deadlines, skills).
2. Las preferencias declaradas de cada trabajador.
3. Criterios de equidad inter-empleado.

Formalizando el problema como una optimización combinatoria multiobjetivo y documentando rigurosamente el uso de herramientas de IA en todas las fases del desarrollo.

### 2.2 Hipótesis falseables

- **H1 (modelado):** es posible expresar preferencias laborales heterogéneas mediante un DSL de reglas que cubra los casos típicos de un equipo de desarrollo, manteniendo la formulación tratable como restricciones blandas dentro de un modelo de optimización.
- **H2 (algorítmica):** existen formulaciones (CP-SAT) que, en instancias de tamaño realista (10–30 personas, 50–200 tareas por sprint), encuentran soluciones de calidad comparable al óptimo en tiempos compatibles con uso interactivo (< 30 s).
- **H3 (metodológica):** un proceso de desarrollo asistido por IA permite construir un sistema de esta complejidad por una sola persona en el plazo de un TFM, con métricas de productividad y calidad documentables.

### 2.3 Aportes esperados

1. **Aporte de dominio:** modelo formal y sistema funcional para incorporar preferencias del trabajador a la planificación de sprints, con tratamiento explícito de la equidad.
2. **Aporte algorítmico:** estudio de la formulación CP-SAT del problema con benchmark sintético reproducible y comparación frente a _baselines_ triviales.
3. **Aporte metodológico:** protocolo documentado y métricas reales sobre el uso de IA en el desarrollo de un sistema no trivial por un único desarrollador.

### 2.4 Ámbito y exclusiones explícitas

**Fuera del alcance** (decisiones tomadas, no se discuten):

- Gestión avanzada de portafolio o multi-proyecto enlazado.
- Facturación, control horario, RR. HH.
- Multi-tenant. El sistema sirve a una organización.
- SSO, autenticación federada. Login simple usuario/contraseña.
- Entrenamiento de modelos de ML propios.
- NLP para parsear reglas en lenguaje natural (editor estructurado).
- Renegociación dinámica mid-sprint.
- Metaheurísticas adicionales (recocido simulado, genéticos). Solo CP-SAT + _baselines_ triviales.
- Implementación de un solver ILP propio (la formulación entra en la memoria como teoría, no como código).
- Estudio con usuarios reales.

**Dentro del alcance del MVP** (lo que sí se construye):

- Sistema web end-to-end usable.
- Editor de reglas con DSL estructurado.
- Motor de optimización con CP-SAT.
- Baselines: asignación aleatoria, _greedy_ por skill-match.
- Generador de datasets sintéticos parametrizable.
- Benchmark reproducible.
- Vista de explicabilidad por asignación.
- Comparador entre planificaciones alternativas.
- Bitácora metodológica del uso de IA.

---

## 3. Restricciones de proyecto

|Restricción|Valor|
|---|---|
|Duración objetivo|12 semanas efectivas|
|Equipo|1 persona|
|Validación|Datasets sintéticos, sin equipo real|
|Peso en evaluación|Producto pesa más que memoria|
|Idioma|Código y documentación técnica en inglés; memoria final en español|

---

## 4. Arquitectura del sistema

### 4.1 Vista de alto nivel

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────────┐
│              │      │                 │      │                  │
│  Frontend    │◄────►│   Backend API   │◄────►│   Optimizer      │
│  (React+TS)  │ HTTP │   (NestJS+TS)   │ HTTP │   (Python)       │
│              │      │                 │      │                  │
└──────────────┘      └────────┬────────┘      └──────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │   PostgreSQL    │
                      └─────────────────┘
```

### 4.2 Stack técnico

|Capa|Tecnología|Justificación|
|---|---|---|
|Frontend|React + TypeScript + Vite + Tailwind + shadcn/ui|Reduce tiempo de UI; stack moderno estándar|
|Backend|NestJS + TypeScript + Prisma|NestJS encaja bien con DDD por capas; módulos, DI nativa, decoradores|
|Arquitectura backend|DDD en 4 capas (Domain / Application / Infrastructure / Presentation)|Separación clara de responsabilidades; testabilidad; aporte académico defendible|
|Base de datos|PostgreSQL 16|Robusta, JSON nativo para params de reglas|
|Optimizador|Python 3.11 + OR-Tools (CP-SAT) + FastAPI|CP-SAT es estado del arte y está en Python|
|Despliegue|Docker Compose|Reproducible para defensa|
|Tests|Jest (backend NestJS), Vitest (frontend), pytest (optimizer)|Estándar de cada ecosistema|
|Documentación API|OpenAPI generado (NestJS Swagger module)||

### 4.3 Por qué microservicio Python

El motor de optimización vive aparte porque:

1. CP-SAT (OR-Tools) tiene su mejor binding en Python; no hay equivalente real en Node.
2. Aísla un componente computacionalmente caro y testeable de forma independiente.
3. Permite escalarlo horizontalmente si en el futuro hace falta.

El backend NestJS llama al optimizador vía HTTP síncrono para el MVP. Si los tiempos pasan de ~10 s, se introduce una cola (BullMQ) y polling desde el frontend.

### 4.4 Modelo de acceso

El sistema es **de uso interno** dentro de la organización. El modelo de acceso refleja esa realidad: la información del equipo no es secreta para nadie de dentro, pero las acciones de gestión sí están restringidas.

|Perfil|Cómo accede|Qué puede hacer|
|---|---|---|
|Anónimo|Solo la URL del sistema|Ver todo en modo lectura: sprints, tareas, asignaciones, dashboards de bienestar agregado, explicabilidad de asignaciones, comparador de runs|
|Miembro|Login simple (usuario + contraseña)|Todo lo del anónimo, **más** cambiar el estado de las tareas que tiene asignadas a sí mismo|
|Admin|Login con credenciales de administrador|Todo lo del miembro, **más** gestión completa: CRUD de miembros, skills, sprints, tareas, lanzar planificaciones, gestionar reglas de cualquier usuario|

**Notas importantes:**

- El reparto del presupuesto de 100 puntos en las reglas lo hace **cada miembro autenticado** sobre sus propias reglas. El admin puede ver y editar las reglas de cualquiera (por ejemplo, para resolver bloqueos).
- Las reglas de preferencia de cada miembro son visibles a todos los anónimos (es información del equipo, no datos personales sensibles). Esta decisión queda explícita en el capítulo de ética de la memoria.
- No hay registro público; las cuentas de miembro las crea el admin.
- Sesiones por JWT. Endpoints públicos no requieren token; los protegidos sí, con `Guard` de NestJS que distingue rol miembro vs. admin.

---

## 5. Modelo de dominio

### 5.1 Entidades principales

```
Organization
└── Team
    ├── Members (User[])
    └── Sprints
        ├── Tasks
        ├── Assignments (TaskId × UserId × StartDay)
        └── PlanningRuns (varias por sprint, comparables)

User
├── Skills (con nivel)
└── Rules (preferencias)
```

### 5.2 Conceptos clave

- **Sprint**: ventana de planificación, definida por `start_date` y `duration_days` (típicamente 10 días laborables). El día 0 es `start_date`.
- **Task**: unidad de trabajo con `effort_days` (entero, ≥ 1), conjunto de `required_skills`, `category`, `domain`, opcional `deadline_day` y opcional `dependencies` (IDs de otras tareas que deben terminar antes). Cada tarea tiene además un `status` ∈ {`TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`} que se modifica durante la ejecución del sprint (no afecta a la planificación inicial, pero sí al dashboard de seguimiento).
- **User**: tiene `skills` (mapa `skill_id → level` 1–5) y un conjunto de reglas de preferencia con un **presupuesto de 100 puntos** repartido entre ellas. Lleva además un `role` ∈ {`MEMBER`, `ADMIN`}.
- **Assignment**: triple `(task_id, user_id, start_day)`. Una tarea ocupa al usuario durante `effort_days` días consecutivos desde `start_day`.
- **PlanningRun**: ejecución concreta del solver sobre un sprint, con su algoritmo, parámetros, resultado y métricas. Un sprint puede tener varias para comparar.

### 5.3 Granularidad temporal

**Día**, no hora. Una tarea ocupa N días consecutivos. No se modelan horas, no se modelan tareas a tiempo parcial. Una persona-día se asigna a una sola tarea (excepción: una persona puede tener varias tareas en días distintos del sprint).

---

## 6. DSL de reglas de preferencia

### 6.1 Estructura común de una regla

Toda regla tiene la misma forma exterior. Lo que varía entre tipos es `params`.

```json
{
  "id": "rule_8f3a2c1d",
  "owner_id": "user_42",
  "type": "PREFER_WEEKDAY",
  "params": { "weekday": "saturday" },
  "weight": 15,
  "is_hard": false,
  "enabled": true,
  "schema_version": 1,
  "created_at": "2026-05-08T10:00:00Z"
}
```

Validación dual: **JSON Schema** generado a partir de un esquema fuente que se usa tanto en el backend NestJS (vía Zod o class-validator) como en el optimizador Python (vía Pydantic). Para evitar divergencia, hay un único fichero de esquema en `/shared/rule-schemas/` y ambos lados lo consumen.

### 6.2 Reparto de pesos: presupuesto fijo

Cada usuario dispone de un total de **100 puntos** para repartir entre sus reglas activas. La UI debe soportar este reparto (por ejemplo, sliders que se rebalancean entre sí).

Si el usuario no completa exactamente 100 (porque desactiva una regla, por ejemplo), el optimizador **normaliza** los pesos al recibirlos. Pero la UI debe ayudar al usuario a llegar a 100 para que entienda el _trade-off_.

Las reglas `is_hard = true` no consumen presupuesto: son restricciones absolutas. Esto se documenta claramente en la UI.

### 6.3 Catálogo de tipos de regla

Diez tipos cubriendo cinco "formas" semánticas. Se congelan en la versión 1 del esquema.

#### Forma A — Atributo de tarea

**`PREFER_SKILL` / `AVOID_SKILL`**

- `params`: `{ skill_id: string }`
- Semántica: el empleado prefiere/evita tareas que requieren esa skill.

**`PREFER_CATEGORY` / `AVOID_CATEGORY`**

- `params`: `{ category: "feature" | "bug" | "infra" | "sre" | "on_call" | "docs" | "research" }`
- Semántica: el empleado prefiere/evita tareas de esa categoría.

**`PREFER_DOMAIN`**

- `params`: `{ domain: string }` (ej. "auth", "billing", "pagos")
- Semántica: el empleado prefiere tareas de ese dominio funcional.

#### Forma B — Temporal absoluta

**`PREFER_WEEKDAY` / `AVOID_WEEKDAY`**

- `params`: `{ weekday: "monday" | "tuesday" | ... | "sunday" }`
- Semántica: el empleado prefiere/evita trabajar tareas que caen en ese día de la semana. Una tarea "cae en" un día si lo solapa (start_day ≤ día ≤ start_day + effort_days − 1).

**`BLACKOUT_DATE`** _(siempre dura)_

- `params`: `{ dates: string[] }` (ISO `YYYY-MM-DD`)
- Semántica: el empleado no puede trabajar esos días. Ninguna tarea asignada a él los solapa.
- No consume presupuesto. No se puede marcar como blanda.

#### Forma C — Carga / volumen

**`MAX_TASKS_PER_SPRINT`**

- `params`: `{ max: int }`
- Semántica: si es dura, ninguna planificación válida le asigna más de `max` tareas en el sprint. Si es blanda, cada exceso penaliza proporcionalmente al peso.

**`FOCUS_PREFERENCE`**

- `params`: `{ }`
- Semántica: el empleado prefiere concentrarse en pocas categorías distintas dentro del sprint. La contribución al objetivo es inversa al número de categorías distintas asignadas a él.

#### Forma D — Secuencia / relación

**`COOLDOWN_AFTER`**

- `params`: `{ after_category: string, rest_days: int }`
- Semántica: tras una tarea de la categoría indicada, el empleado prefiere/exige `rest_days` días sin tareas nuevas.
- Ejemplo canónico: `{ after_category: "on_call", rest_days: 1 }`.

#### Forma E — Crecimiento

**`LEARN_SKILL`**

- `params`: `{ skill_id: string, min_tasks: int }`
- Semántica: el empleado quiere recibir al menos `min_tasks` tareas que requieran esa skill, **incluso si no la tiene en su perfil**. Esto invierte deliberadamente la heurística operativa de "asignar por skill-match" y crea una tensión interesante entre eficiencia y crecimiento.

### 6.4 Validación del conjunto de reglas

Antes de guardar un conjunto de reglas para un usuario, validar:

1. **Conflictos directos:** mismo tipo con `params` opuestos (`PREFER_WEEKDAY: saturday` + `AVOID_WEEKDAY: saturday`).
2. **Suma de pesos:** debe poder llegar a 100. Avisar si no.
3. **Conflictos cruzados:** `PREFER_CATEGORY: sre` + `AVOID_CATEGORY: sre`, etc.
4. **Esquema:** `params` válido contra el JSON Schema del tipo.

Detectar conflictos en el backend antes de enviar al optimizador. Devolver lista de conflictos al frontend para que el usuario los resuelva.

### 6.5 Versionado del DSL

Cada regla guardada lleva `schema_version`. Si el DSL evoluciona, las reglas viejas se interpretan con su versión original o se migran explícitamente. Versión actual: **1**.

---

## 7. Formulación matemática del problema

### 7.1 Variables de decisión

- `assigned[i, j] ∈ {0, 1}`: la tarea `i` se asigna al usuario `j`.
- `start[i] ∈ {0, ..., D - 1}`: día de inicio de la tarea `i`, donde `D = duration_days` del sprint.
- `interval[i]`: `IntervalVar` de CP-SAT con `start[i]`, duración `effort_days[i]` y `end[i] = start[i] + effort_days[i]`.

### 7.2 Restricciones duras (siempre)

**R1. Asignación única:** cada tarea va exactamente a una persona. $$\sum_j \text{assigned}[i, j] = 1 \quad \forall i$$

**R2. No solapamiento por persona:** los intervalos de las tareas asignadas a una misma persona no se solapan. Modelado con `AddNoOverlap` sobre los intervalos opcionales que dependen de `assigned[i, j]`.

**R3. Horizonte:** `start[i] + effort_days[i] ≤ D` para toda tarea `i`.

**R4. Deadlines:** si la tarea `i` tiene `deadline_day`, entonces `start[i] + effort_days[i] ≤ deadline_day + 1`.

**R5. Dependencias:** si `i → k` (la tarea `k` depende de `i`), entonces `end[i] ≤ start[k]`.

**R6. Skill mínimo (configurable):** para cada `required_skill` de la tarea `i`, la persona `j` debe tener esa skill con nivel ≥ umbral. Salvo que exista una regla `LEARN_SKILL` del usuario `j` sobre esa skill, que **relaja** esta restricción para esa terna concreta.

**R7. Reglas duras:** cada regla con `is_hard = true` se compila a una restricción dura específica (ver sección 6.3 para semántica de cada tipo).

### 7.3 Felicidad individual

Para cada usuario `j` con reglas blandas $r_1, ..., r_{n_j}$ con pesos $w_{r_k}^j$ y cumplimientos $c_{r_k}^j \in [0, 1]$:

$$f_j = \frac{\sum_{k=1}^{n_j} w_{r_k}^j \cdot c_{r_k}^j}{\sum_{k=1}^{n_j} w_{r_k}^j}$$

`f_j ∈ [0, 1]`. El cumplimiento `c` es **fraccional** en general (por ejemplo, "el 80% de mis tareas son Python" → `c = 0.8`).

Notar que los pesos están normalizados de hecho a 100 (presupuesto), pero la fórmula es invariante al factor común.

### 7.4 Funciones objetivo (selector de equidad)

El usuario que lanza la planificación elige uno de tres modos de agregación, que se comparan en el benchmark:

- **Utilitarista (suma):** $F = \sum_j f_j$
- **Max-min (Rawlsiano):** $F = \min_j f_j$ — maximizar el mínimo, protege al menos feliz.
- **Nash (producto, en logs):** $F = \sum_j \log(f_j + \varepsilon)$ — equilibrio entre suma y mínimo.

Para implementación CP-SAT, los `f_j` reales se aproximan multiplicando por un factor entero grande (CP-SAT trabaja con enteros).

### 7.5 Penalización de reglas blandas violadas

En la práctica, en lugar de calcular `f_j` y maximizar `F` directamente, es más limpio para el solver:

1. Por cada regla blanda, definir variables que cuantifican cumplimiento.
2. Maximizar suma ponderada de cumplimientos, normalizada por usuario y agregada según el modo elegido.

Esta traducción es responsabilidad del módulo `rule_compiler` del optimizador.

### 7.6 Complejidad

El problema generaliza el _Generalized Assignment Problem_ (GAP) y se aproxima al _Resource-Constrained Project Scheduling Problem_ (RCPSP) con preferencias. Ambos son NP-difíciles. La justificación formal de NP-dificultad entra en el capítulo 3 de la memoria.

---

## 8. Algoritmos a implementar

### 8.1 Solver principal: CP-SAT

Microservicio Python con OR-Tools. Recibe el problema en JSON, devuelve la asignación + métricas. Timeout configurable (por defecto 30 s).

Output esperado:

- `status`: `OPTIMAL` | `FEASIBLE` | `INFEASIBLE` | `TIMEOUT`
- `assignments`: `[{task_id, user_id, start_day}]`
- `objective_value`: float
- `per_user_happiness`: `{user_id: f_j}`
- `rule_evaluations`: `[{rule_id, satisfied: bool|float, contribution: float}]` — base de la explicabilidad.
- `solver_stats`: tiempo, número de branches, conflictos.

### 8.2 Baseline 1: Random

Asignación aleatoria que respeta solo las restricciones duras estructurales (asignación única, no solapamiento, deadlines, dependencias). Útil como suelo absoluto.

### 8.3 Baseline 2: Greedy por skill-match

1. Ordenar tareas por número de skills requeridas (descendente) y por deadline (ascendente).
2. Para cada tarea, elegir el usuario con mejor skill-match disponible en la ventana válida más temprana.
3. No considera preferencias en absoluto.

Sirve para mostrar cuánto bienestar deja sobre la mesa una asignación operativamente razonable pero ciega a preferencias.

### 8.4 Comparación

El benchmark mide, para varios tamaños de instancia:

- Tiempo de ejecución.
- Valor de la función objetivo (bajo cada modo de equidad).
- Felicidad media, mínima, máxima.
- Porcentaje de reglas blandas satisfechas.

---

## 9. Generador de datasets sintéticos

Herramienta CLI (Python, dentro del repo del optimizador) que genera instancias parametrizables del problema:

```bash
sprintwell-gen \
  --users 15 \
  --tasks 80 \
  --days 10 \
  --skills 12 \
  --rule-density 0.6 \
  --conflict-density 0.1 \
  --seed 42 \
  --out instance_001.json
```

Parámetros:

- `users`: número de personas.
- `tasks`: número de tareas.
- `days`: duración del sprint.
- `skills`: tamaño del catálogo de skills.
- `rule-density`: 0–1, controla cuántas reglas por usuario en media.
- `conflict-density`: probabilidad de generar instancias con reglas potencialmente conflictivas (para estresar al solver).
- `seed`: para reproducibilidad.

Output: JSON con la estructura completa del problema, listo para enviar al optimizador o para fixture de tests.

---

## 10. Funcionalidades del producto

### 10.1 MVP (entregable a las 12 semanas)

Las funcionalidades se agrupan según el perfil que puede usarlas (ver sección 4.4).

#### Accesibles sin login (vista pública)

- Vista general del equipo (miembros y sus skills).
- Lista de sprints (pasados, activo, próximos).
- Vista detalle de un sprint con sus tareas y asignaciones.
- Tablero tipo Gantt o calendario semanal mostrando, por persona, las tareas asignadas día a día y su `status` actual.
- Dashboard de bienestar agregado del sprint: barras de felicidad por persona, métricas globales (media, min, max).
- Vista de explicabilidad por asignación: al pinchar una tarea, mostrar qué reglas del asignado se satisfacen, cuáles no, cuánto suma cada una.
- Comparador de dos `PlanningRun` del mismo sprint.
- Vista de reglas declaradas por cada miembro (las reglas de preferencia son información del equipo, no privada).

#### Accesibles para un miembro autenticado

Todo lo anterior, más:

- Cambiar el `status` de las tareas que tiene asignadas a sí mismo (`TODO` ↔ `IN_PROGRESS` ↔ `DONE` ↔ `BLOCKED`).
- Editor de **sus propias** reglas de preferencia (crear, editar, eliminar, habilitar/deshabilitar).
- Indicador visual del reparto de presupuesto sobre sus reglas (suma actual / 100).
- Toggle hard/soft donde aplique.
- Detector de conflictos antes de guardar.

#### Accesibles solo para admin

Todo lo anterior, más:

- CRUD de miembros (alta, baja, edición, reset de contraseña).
- Promover / degradar rol de miembro a admin y viceversa.
- CRUD del catálogo de skills.
- Asignación de skills y niveles a cualquier miembro.
- CRUD de sprints (fechas, duración).
- CRUD de tareas dentro de un sprint: título, descripción, `effort_days`, `required_skills`, `category`, `domain`, `deadline_day` opcional, `dependencies` opcional, asignación manual opcional.
- Lanzar planificación con selector de algoritmo (CP-SAT / random / greedy) y modo de equidad. Cada ejecución es un `PlanningRun` persistido.
- Editar las reglas de cualquier miembro (por si hay bloqueo, ausencia prolongada, o necesidad de resolver conflictos).
- Cambiar el `status` de cualquier tarea (no solo las asignadas a uno mismo).

### 10.2 Fuera del MVP, pero pensar la extensibilidad

- Exportar planificación a CSV/JSON.
- API pública documentada con OpenAPI.
- Modo "qué pasaría si" cambiando los pesos de un usuario sin guardar.

---

## 11. Plan de trabajo (12 semanas)

|Semana|Hito|Entregables concretos|
|---|---|---|
|1|Setup y formalización|Repo monorepo con backend/frontend/optimizer/shared; CI mínimo (lint + test); esqueleto de los 3 servicios; **scaffolding NestJS con las 4 capas DDD y un caso de uso de extremo a extremo como referencia ("hello aggregate")**; documento de formalización matemática en LaTeX; bitácora metodológica activa|
|2|Optimizador v1|CP-SAT con R1–R5, asignación + tiempos; tests unitarios sobre instancias de juguete|
|3|Optimizador v2|Compilación de los 10 tipos de regla; baselines random y greedy; generador sintético v1|
|4|Backend v1 (DDD)|Domain + Application + Infrastructure para `identity`, `team`, `sprint`. Presentation con endpoints públicos (read-only) y admin (CRUD). Auth JWT con guards `MemberGuard` / `AdminGuard`|
|5|Backend v2 (DDD)|Domain + Application + Infrastructure para `rules` y `planning`. Endpoints de miembro (cambio de estado de tareas propias, edición de reglas propias). Validación y detección de conflictos. Integración con optimizador|
|6|Frontend v1|Setup React; vista pública (lectura sin login); login de miembro y admin|
|7|Frontend v2|Editor de reglas con reparto de presupuesto; CRUD de skills (admin); CRUD de sprints y tareas (admin); cambio de estado de tareas (miembro)|
|8|Frontend v3|Lanzamiento de planificación; vista de resultado tipo Gantt con `status` de tareas; dashboard de bienestar|
|9|Explicabilidad|Extracción de evaluaciones de regla desde CP-SAT; vista de detalle por asignación; comparador de runs|
|10|Benchmark|Experimentos a escalas (5,10,20,30 usuarios × 30,80,150,200 tareas) × 3 modos de equidad; gráficas; análisis|
|11|Memoria parte I|Capítulos 1–4 redactados (intro, estado del arte, modelo, algoritmo)|
|12|Memoria parte II + defensa|Capítulos 5–9; presentación; ensayo|

---

## 12. Metodología de desarrollo asistido por IA

Esta parte es **contribución académica** de la tesis, no anécdota. Se trata desde el día 1.

### 12.1 Herramientas usadas

- **Claude Code** para desarrollo asistido y refactor en CLI.
- Otros asistentes IDE según convenga (se documenta cuándo y por qué).
- IA para revisión de literatura y redacción de la memoria, documentando prompts.

### 12.2 Bitácora obligatoria

Una hoja por sesión de trabajo, con como mínimo:

- Fecha y duración.
- Tarea concreta abordada (ID de issue).
- Herramientas IA usadas.
- Tipo de uso: generación de código nuevo, refactor, debugging, diseño, redacción, revisión.
- Prompt o estrategia de prompting (resumen).
- Estimación de % de output aprovechado tras revisión.
- Defectos descubiertos posteriormente atribuibles al código generado por IA.
- Observación cualitativa breve.

Formato: CSV o tabla en Markdown versionada en el repo, en `/docs/methodology/log.md` o equivalente.

### 12.3 Análisis a producir

En el capítulo metodológico de la memoria:

- Estadística agregada de la bitácora.
- Patrones de prompting que funcionaron mejor por tipo de tarea.
- Casos donde la IA aceleró significativamente.
- Casos donde la IA introdujo deuda técnica o errores no triviales.
- Reflexión sobre productividad percibida vs. medida.
- Conjunto de buenas prácticas como output reproducible.

---

## 13. Validación

### 13.1 Funcional

- Suite de tests unitarios (objetivo: ≥ 70% de cobertura en lógica de negocio y compilación de reglas).
- Tests de integración API ↔ optimizador.
- Tests end-to-end de los flujos principales (Playwright) — al menos: crear sprint, definir reglas, planificar, ver resultado.

### 13.2 Algorítmica

Benchmark sintético comparando CP-SAT contra los dos baselines:

- Tamaños de instancia (al menos 4): 5×30, 10×80, 20×150, 30×200 (usuarios × tareas).
- 3 modos de equidad.
- 10 instancias por configuración (para promediar con seeds distintas).
- Métricas: tiempo, valor objetivo, felicidad media/min/max, % reglas blandas satisfechas, % deadlines cumplidos.
- Outputs: tablas + gráficas + análisis discursivo.

### 13.3 Caso de estudio

Generar manualmente una instancia "semi-realista" inspirada en un equipo de desarrollo verosímil (con biografías, skills y reglas plausibles) y discutir cualitativamente los resultados de cada algoritmo y modo de equidad. No requiere usuarios reales.

---

## 14. Estructura del repositorio (propuesta)

```
sprintwell/
├── backend/                                # NestJS + TypeScript + Prisma (DDD en 4 capas)
│   ├── src/
│   │   ├── domain/                         # Capa de dominio: entidades, value objects, reglas de negocio puras
│   │   │   ├── shared/                     #   Tipos compartidos: Id, Result, DomainEvent, base classes
│   │   │   ├── identity/                   #   User (aggregate), Role (VO), Credentials (VO), UserRepository (interface)
│   │   │   ├── team/                       #   Team (aggregate), Skill, SkillLevel (VO), TeamRepository (interface)
│   │   │   ├── rules/                      #   RuleSet (aggregate), Rule (entity), Weight (VO), RuleType (VO), políticas de validación, RuleSetRepository (interface)
│   │   │   ├── sprint/                     #   Sprint (aggregate), Task (entity), TaskStatus (VO), Assignment (VO), SprintRepository (interface)
│   │   │   └── planning/                   #   PlanningRun (aggregate), PlanningStrategy (VO), HappinessScore (VO), PlanningRunRepository (interface)
│   │   ├── application/                    # Capa de aplicación: orquestación, casos de uso (commands/queries)
│   │   │   ├── shared/                     #   Buses, DTOs base, transactional decorator
│   │   │   ├── identity/                   #   LoginUseCase, ChangePasswordUseCase, …
│   │   │   ├── team/                       #   CreateMemberUseCase, AssignSkillUseCase, …
│   │   │   ├── rules/                      #   UpsertRuleUseCase, ListRulesQuery, ValidateRuleSetUseCase, …
│   │   │   ├── sprint/                     #   CreateSprintUseCase, AddTaskUseCase, ChangeTaskStatusUseCase, …
│   │   │   └── planning/                   #   LaunchPlanningUseCase, GetPlanningRunQuery, ComparePlanningRunsQuery, …
│   │   ├── infrastructure/                 # Capa de infraestructura: implementaciones concretas
│   │   │   ├── persistence/                #   Prisma client, mappers Domain ↔ Persistence, repositorios concretos
│   │   │   │   ├── prisma/                 #     schema.prisma, migrations
│   │   │   │   ├── repositories/           #     PrismaUserRepository, PrismaTeamRepository, …
│   │   │   │   └── mappers/
│   │   │   ├── optimizer/                  #   Cliente HTTP del optimizador Python (axios), adaptadores de payload
│   │   │   ├── auth/                       #   JWT service, password hashing (argon2/bcrypt), passport strategies
│   │   │   └── config/                     #   Configuración tipada, validación de env
│   │   ├── presentation/                   # Capa de presentación: HTTP/REST, adaptadores entrantes
│   │   │   ├── http/
│   │   │   │   ├── public/                 #   Controllers de endpoints públicos (read-only)
│   │   │   │   ├── member/                 #   Controllers de endpoints de miembro (cambio de estado, sus reglas)
│   │   │   │   └── admin/                  #   Controllers de gestión completa
│   │   │   ├── dto/                        #   Request/Response DTOs con class-validator
│   │   │   ├── guards/                     #   PublicGuard, MemberGuard, AdminGuard
│   │   │   ├── decorators/                 #   @CurrentUser, @Roles
│   │   │   └── filters/                    #   Exception filters, mapeo de DomainError → HTTP status
│   │   ├── app.module.ts                   # Composition root: cablea capas, registra providers, módulos por contexto
│   │   └── main.ts                         # Bootstrap NestJS, Swagger, global pipes/filters
│   ├── test/
│   │   ├── unit/                           # Pruebas de Domain y Application (sin infraestructura)
│   │   ├── integration/                    # Pruebas con Prisma sobre DB de test
│   │   └── e2e/                            # Pruebas end-to-end HTTP
│   ├── nest-cli.json
│   └── tsconfig.json
├── frontend/                               # React + TS + Vite
│   ├── src/
│   └── tests/
├── optimizer/                              # Python + OR-Tools + FastAPI
│   ├── src/
│   │   ├── solvers/
│   │   │   ├── cpsat.py
│   │   │   ├── random.py
│   │   │   └── greedy.py
│   │   ├── rule_compiler/
│   │   └── api.py
│   ├── tests/
│   └── cli/                                # Generador de datasets
├── shared/
│   └── rule-schemas/                       # JSON Schema fuente de verdad, consumido por backend y optimizer
├── docs/
│   ├── thesis/                             # Memoria LaTeX
│   ├── methodology/                        # Bitácora y análisis IA
│   └── adr/                                # Architecture Decision Records
├── benchmarks/
│   ├── instances/
│   ├── results/
│   └── notebooks/
├── docker-compose.yml
└── README.md
```

### 14.1 Reglas de las capas (importante para Claude Code)

Para que la separación DDD no se degrade:

- **Domain no importa de ninguna otra capa.** Cero dependencias hacia Application, Infrastructure o Presentation. Cero anotaciones de NestJS, Prisma o frameworks. Solo TypeScript puro.
- **Application depende solo de Domain.** Define interfaces (puertos) y consume las interfaces de repositorio definidas en Domain. Aquí viven los casos de uso (Commands y Queries).
- **Infrastructure implementa interfaces de Domain y depende de Application/Domain hacia dentro.** Aquí van Prisma, clientes HTTP, JWT, etc. **Las clases de Prisma no salen de aquí**: los mappers traducen a entidades de dominio antes de cruzar la frontera.
- **Presentation depende de Application** (a través de la inyección que cablea `app.module.ts`). Solo controllers, DTOs, guards y filters.
- **Composición**: `app.module.ts` es el único sitio donde se cablea qué implementación concreta de Infrastructure satisface qué interfaz de Domain. Esto se hace con `useClass` / `useFactory` de NestJS y tokens de inyección por interfaz.

Esta disciplina es la que hace defendible la decisión arquitectónica en la memoria.

---

## 15. Riesgos identificados y mitigaciones

|Riesgo|Mitigación|
|---|---|
|El optimizador no escala a 30×200|Tener baselines siempre operativos; mostrar trade-off de calidad/tiempo en la memoria; subir timeout es legítimo si se documenta|
|El alcance del producto come tiempo a lo académico|Hitos quincenales; UI deliberadamente austera; no implementar nada fuera de la lista del MVP|
|Bitácora metodológica que se queda en anécdota|Activarla literalmente en el commit 1; revisión semanal|
|Reglas con conflictos no detectados que rompen el solver|Validación exhaustiva en backend antes de enviar al optimizador; tests con instancias adversariales|
|Cambios al DSL mid-proyecto|Congelar el esquema v1 en semana 1; cualquier ampliación es schema v2 con migración explícita|
|Cuestionamientos éticos del tribunal|Capítulo dedicado a ética en la memoria: consentimiento, opacidad de pesos individuales al manager, derecho a no declarar reglas, asimetrías de poder|

---

## 16. Definición de "hecho" (Definition of Done por issue)

Para que un issue se considere cerrado:

1. Código en `main` tras revisión propia documentada.
2. Tests pasando en CI.
3. Si toca el DSL o el modelo de datos: documentación actualizada en este brief o en ADR específico.
4. Si toca metodología: entrada correspondiente en la bitácora.
5. Si introduce capacidad visible al usuario: smoke test manual documentado con captura o GIF.

---

## 17. Decisiones tomadas (cerrar discusión)

Estas decisiones están **cerradas** y no se reabren salvo justificación fuerte:

- **Backend**: NestJS + TypeScript + Prisma. No Fastify.
- **Arquitectura backend**: DDD estricto en 4 capas (Domain, Application, Infrastructure, Presentation) dentro de `backend/src/`. Reglas de dependencia descritas en sección 14.1.
- **Modelo de acceso**: público en lectura, miembro autenticado para cambiar estado de sus tareas y editar sus reglas, admin para gestión completa. Sin registro público.
- Granularidad temporal: día.
- Pesos: presupuesto fijo de 100 puntos por usuario.
- Cumplimiento `c`: fraccional en `[0, 1]`, no binario.
- Solver: solo CP-SAT como solver real; ILP entra como teoría en memoria.
- Multi-tenant: no.
- Idioma de código: inglés. Idioma de memoria: español.
- NLP: no.
- Modos de equidad: utilitarista, max-min, Nash. Se comparan en el benchmark.
- 10 tipos de regla en v1 del DSL (sección 6.3). No se añaden más en el MVP.
- Estados de tarea: `TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`.

---

## 18. Glosario rápido

- **DSL**: Domain-Specific Language. Lenguaje pequeño para el dominio concreto, aquí las reglas de preferencia.
- **DDD**: Domain-Driven Design. Estrategia de diseño que pone el modelo del dominio en el centro y separa responsabilidades en capas.
- **Capas DDD** (usadas en este proyecto):
    - **Domain**: lógica de negocio pura, sin dependencias externas. Entidades, value objects, agregados, interfaces de repositorio.
    - **Application**: orquestación de casos de uso. Coordina dominio e infraestructura sin contener reglas de negocio.
    - **Infrastructure**: implementaciones concretas (BD, HTTP clients, auth). Implementa las interfaces de Domain.
    - **Presentation**: adaptadores entrantes (controllers HTTP, DTOs, guards).
- **Aggregate**: en DDD, conjunto de entidades tratado como una unidad transaccional con un _aggregate root_ como única puerta de entrada.
- **Value Object**: objeto inmutable definido por sus valores, no por identidad (p. ej. `Weight`, `TaskStatus`).
- **CP-SAT**: Constraint Programming + SAT, solver de OR-Tools.
- **ILP / MILP**: Integer / Mixed-Integer Linear Programming.
- **GAP**: Generalized Assignment Problem.
- **RCPSP**: Resource-Constrained Project Scheduling Problem.
- **Restricción dura vs. blanda**: la dura invalida la solución si se viola; la blanda penaliza el objetivo.
- **PlanningRun**: ejecución del solver sobre un sprint, persistida, comparable con otras.
- **Skill match**: solapamiento entre las skills requeridas por una tarea y las que tiene la persona.

---

## 19. Cómo usar este documento con Claude Code

Este brief es el punto de partida. Para sacar issues:

1. Recorrer secciones 4 (arquitectura), 5 (modelo de dominio), 6 (DSL), 10 (funcionalidades) y 14 (estructura de repo) en orden.
2. Cada subsección de 10 da pie a un _epic_ o conjunto de issues.
3. Cada tipo de regla en 6.3 da pie a al menos dos issues: definición de esquema + compilación al solver + UI de edición.
4. Cada algoritmo en 8 da pie a un issue grande con sub-tareas (interfaz, implementación, tests, integración).
5. La sección 11 da el orden temporal; los issues se priorizan según ese cronograma.

Cualquier cambio sustancial que se descubra durante la implementación debe **primero modificar este documento** y luego implementarse, no al revés.