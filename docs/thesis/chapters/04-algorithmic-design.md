# Capítulo 4 — Diseño algorítmico

Este capítulo cierra la distancia entre la formulación matemática del capítulo 3 y el modelo ejecutable que resuelve el _optimizer_. Describe cómo las restricciones duras R1–R7 y las reglas blandas del DSL se traducen a variables y restricciones de CP-SAT, cómo se agregan las felicidades bajo cada modo de equidad, y qué baselines triviales sirven de referencia. La discusión sigue de cerca la implementación de referencia (`optimizer/src/`), citada entre paréntesis para trazabilidad.

## 4.1 Del modelo formal al modelo CP-SAT

El modelo se construye en `solvers/cpsat` (`build_base_model`) sobre tres familias de variables:

- **Asignación** $x_{i,j} \in \{0,1\}$ (`assigned[(task_id, user_id)]`): vale 1 si la tarea $i$ se asigna al usuario $j$.
- **Inicio** $s_i \in H$ (`start[task_id]`): día de comienzo de la tarea $i$ dentro del horizonte.
- **Intervalos opcionales** $\text{interval}_{i,j}$ (`OptionalIntervalVar`): un intervalo de duración $e_i$ que existe si y solo si $x_{i,j}=1$. Es el mecanismo idiomático de CP-SAT para expresar la no solapación por usuario (R5) mediante la restricción global `AddNoOverlap`.

La elección de CP-SAT sobre un MILP puro responde a tres razones prácticas: (1) las restricciones globales `AddNoOverlap` y `AddAllowedAssignments` expresan la no solapación y el _skill match_ con propagación eficiente; (2) el solver es heurístico-completo (capítulo 2), devolviendo soluciones factibles de calidad bajo presupuesto acotado y probando optimalidad si dispone de tiempo; y (3) OR-Tools ofrece una API estable y madura en Python, coherente con el resto del _optimizer_.

## 4.2 Restricciones duras en CP-SAT

Cada familia R1–R7 del capítulo 3 se materializa así (`solvers/cpsat`):

- **R1 — asignación única.** $\sum_j x_{i,j} = 1$ para toda tarea $i$: cada tarea va a exactamente un usuario.
- **R2 — competencia (_skill match_).** Solo se permite $x_{i,j}=1$ si el usuario $j$ posee todas las skills de $\rho_i$. Se implementa como pre-filtro: las variables $x_{i,j}$ inviables no se crean (dominan a la restricción explícita y reducen el modelo).
- **R3 — dependencias.** Para cada $i' \in \text{dep}(i)$: $s_i \geq s_{i'} + e_{i'}$, condicionada a que ambas tareas estén asignadas. Precedencia temporal sobre los inicios.
- **R4 — deadlines.** Si $\delta_i \neq \bot$: $s_i + e_i \leq \delta_i + 1$ (la tarea termina no más tarde del día límite).
- **R5 — no solapación por usuario.** `AddNoOverlap` sobre los intervalos opcionales de cada usuario: una persona no ejecuta dos tareas el mismo día.
- **R6 — relajación por aprendizaje.** La regla `LEARN_SKILL` relaja R2 para el usuario que declara intención de aprender: se permite asignarle tareas de una skill que aún no domina (el pre-filtro se amplía con las skills en aprendizaje, calculadas por `rule_compiler/learn_skill`).
- **R7 — horizonte.** $s_i + e_i \leq D$: toda tarea cabe dentro del sprint.

El pre-filtro de R2/R6 es una decisión de diseño relevante: en lugar de crear todas las $nm$ variables y prohibir las inviables, se crean solo las viables, reduciendo el tamaño del modelo y acelerando la propagación.

## 4.3 El _rule compiler_: del DSL a términos de cumplimiento

El aporte de dominio (H1) se materializa en el _rule compiler_ (`rule_compiler/`), que traduce cada regla blanda del DSL a un **término de cumplimiento** $c_r \in [0,1]$ expresado con variables de CP-SAT. Cada uno de los 12 tipos de regla tiene un compilador dedicado:

- `PREFER_SKILL` / `AVOID_SKILL`, `PREFER_CATEGORY` / `AVOID_CATEGORY`, `PREFER_DOMAIN`: fracción de tareas asignadas al usuario que casan (o no) con el atributo — un término lineal sobre las $x_{i,j}$ del usuario.
- `PREFER_WEEKDAY` / `AVOID_WEEKDAY`, `BLACKOUT_DATE`: dependen del día de inicio $s_i$; se compilan con variables indicadoras del día de la semana. `BLACKOUT_DATE` suele declararse dura.
- `MAX_TASKS_PER_SPRINT`: cota sobre $\sum_i x_{i,j}$.
- `COOLDOWN_AFTER`: separación temporal mínima tras una tarea de cierta categoría.
- `FOCUS_PREFERENCE`: recompensa agrupar tareas del mismo dominio.
- `LEARN_SKILL`: además de relajar R6 (§4.2), premia asignar al menos `min_tasks` tareas de la skill objetivo.

`compile_by_owner` agrupa los términos por usuario y produce, para cada $j$, la lista de pares $(w_r, c_r)$ de sus reglas blandas. El _rule compiler_ importa perezosamente `solvers` para romper el ciclo de importación (`rule_compiler ↔ solvers`), una sutileza de la implementación documentada en el código. La cobertura de los 12 tipos sin lenguaje natural libre es la evidencia con la que se contrasta H1 (capítulo 7).

## 4.4 Agregación por modo de equidad

`attach_equity_objective` (`solvers/cpsat`) construye la función objetivo a partir de los términos por usuario, según el modo:

- **Utilitarista:** maximiza $\sum_j \tilde f_j$, con $\tilde f_j = \sum_r w_r c_r$ (suma lineal directa).
- **Max-min:** introduce $\mu$ con $\mu \leq \tilde f_j\ \forall j$ y maximiza $\mu$.
- **Nash:** maximiza $\sum_j \log(\tilde f_j)$ mediante linealización por tramos del logaritmo sobre el dominio entero cuantizado.

Cuando un usuario no tiene reglas blandas, su término se fija al máximo (satisfacción por convención, ec. 3.8). Como se declaró en la Observación 3.1, la agregación opera sobre los términos **absolutos** $\tilde f_j$ (sin normalizar por el peso total del usuario) para mantener la linealidad; el índice reportado al usuario, en cambio, es el $f_j$ normalizado. La divergencia entre ambos se analiza empíricamente en el capítulo 7. Si no hay reglas blandas en toda la instancia, el atacador de equidad recae en un objetivo trivial de _makespan_ (minimizar el día de fin máximo), garantizando un modelo bien definido.

## 4.5 Baselines

Para contextualizar la calidad de CP-SAT (H2), el _optimizer_ implementa dos baselines triviales (`solvers/random`, `solvers/greedy`) que resuelven el mismo `ProblemInput` y emiten el mismo `SolverOutput`:

- **Aleatorio (`solve_random`).** Asigna cada tarea a un usuario capaz elegido al azar (con semilla para reproducibilidad) y programa los inicios sin optimizar. Representa el límite inferior: una asignación que respeta las duras pero ignora las preferencias.
- **_Greedy_ por skill-match (`solve_greedy`).** Asigna cada tarea, en orden, al usuario capaz con menor carga acumulada. Representa la heurística "sensata pero miope" que un _team lead_ aplicaría sin herramienta: equilibra carga pero no pondera preferencias ni equidad.

Ambos baselines comparten la lógica de explicabilidad y felicidad post-hoc, de modo que sus métricas (felicidad, % de reglas satisfechas) son directamente comparables con las de CP-SAT.

## 4.6 El _runner_ y el mapeo de estados

`solvers/runner` (`solve`, `solve_problem`) orquesta el ciclo completo: construye el modelo base, compila las reglas por usuario, adjunta el objetivo de equidad y lanza `cp_model.CpSolver` con un presupuesto de tiempo (`max_time_in_seconds`) y una semilla opcional (`random_seed`) que hace reproducible la búsqueda. El estado de OR-Tools se mapea a `RunStatus` (brief §8.1):

| Estado OR-Tools | `RunStatus` | Significado |
| :--- | :--- | :--- |
| `OPTIMAL` | `OPTIMAL` | óptimo probado |
| `FEASIBLE` (bajo presupuesto) | `FEASIBLE` | solución factible, no probada óptima |
| `FEASIBLE` (agotó presupuesto) | `TIMEOUT` | factible pero se alcanzó el límite de tiempo |
| `INFEASIBLE` | `INFEASIBLE` | no existe asignación válida |
| `UNKNOWN` | `TIMEOUT` | sin solución factible dentro del presupuesto |
| `MODEL_INVALID` | (excepción) | bug del constructor del modelo, no del problema |

Tras resolver, `explainability.evaluate_rules` reconstruye los cumplimientos $c_r$ y las felicidades $f_j$ del esquema elegido, alimentando la explicabilidad por asignación (capítulo 5) y las métricas del benchmark (capítulo 7).

## 4.7 Resumen

El diseño algorítmico convierte una formulación NP-difícil en un modelo CP-SAT ejecutable: variables de asignación e intervalos para las duras, un _rule compiler_ modular para las blandas del DSL, tres atacadores de equidad y dos baselines de referencia, todo orquestado por un _runner_ con presupuesto y semilla. La calidad y los tiempos de este diseño se miden en el capítulo 7.
