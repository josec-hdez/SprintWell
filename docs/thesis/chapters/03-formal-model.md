# Capítulo 3 — Modelo formal del problema

Este capítulo formaliza matemáticamente el problema de planificación de sprints que resuelve SprintWell. Parte del enunciado informal del brief del proyecto (§7) y lo eleva a una formulación rigurosa en términos de conjuntos índice, parámetros, variables de decisión, restricciones, función de utilidad por usuario y funciones objetivo de equidad. Cierra con un análisis de complejidad que establece la NP-dificultad del problema mediante reducción desde el _Generalized Assignment Problem_ (GAP) y observa el solapamiento con el _Resource-Constrained Project Scheduling Problem_ (RCPSP).

La notación elegida sigue las convenciones de Investigación Operativa para Programación Entera Mixta (MIP) y Programación con Restricciones (CP). Los nombres de variables del código del optimizador (`assigned[i,j]`, `start[i]`, `effort_days[i]`) se mantienen como referencia entre paréntesis para facilitar la trazabilidad entre la memoria y la implementación de referencia (módulo `optimizer/`).

## 3.1 Conjuntos índice y parámetros

### Conjuntos índice

Sean:

- $T$: conjunto finito de tareas del sprint, con $|T| = n$ e índice genérico $i \in T$.
- $U$: conjunto finito de usuarios (miembros del equipo), con $|U| = m$ e índice genérico $j \in U$.
- $H = \{0, 1, \dots, D-1\}$: horizonte temporal discreto del sprint, donde $D \in \mathbb{Z}_{\geq 1}$ es la duración en días (parámetro `duration_days` del sprint). Para evitar la sobrecarga de notación entre $D$ como conjunto y como cardinal, usamos $H$ para el conjunto y $D$ exclusivamente como su cardinal.
- $S$: conjunto finito de _skills_ (capacidades técnicas), con índice $s \in S$.
- $\mathcal{R}_j$: conjunto de reglas de preferencia del usuario $j$. Se particiona en reglas duras y reglas blandas: $\mathcal{R}_j = \mathcal{R}_j^{\text{hard}} \cup \mathcal{R}_j^{\text{soft}}$, con $\mathcal{R}_j^{\text{hard}} \cap \mathcal{R}_j^{\text{soft}} = \emptyset$.

### Parámetros de tareas

Para cada tarea $i \in T$:

- $e_i \in \mathbb{Z}_{\geq 1}$: esfuerzo en días enteros (`effort_days[i]`).
- $\rho_i \subseteq S$: conjunto de skills requeridas por la tarea (`required_skills[i]`).
- $\delta_i \in H \cup \{\bot\}$: día límite (`deadline_day[i]`); $\bot$ indica que la tarea no tiene deadline.
- $\text{dep}(i) \subseteq T$: conjunto de tareas predecesoras (`dependencies[i]`); la tarea $i$ no puede comenzar antes de que todas las tareas en $\text{dep}(i)$ hayan terminado.

### Parámetros de usuarios

Para cada usuario $j \in U$ y cada skill $s \in S$:

- $\sigma_{j,s} \in \{0, 1, 2, 3, 4, 5\}$: nivel de la skill $s$ del usuario $j$. El nivel $0$ representa "no posee la skill"; los niveles $1$ a $5$ son una escala creciente de dominio.
- $c_j \in \mathbb{Z}_{\geq 1}$: capacidad efectiva en días-persona del usuario $j$ durante el horizonte (por defecto $c_j = D$; puede reducirse para modelar ausencias parciales).

Para cada regla $r \in \mathcal{R}_j$:

- $w_r^j \in \mathbb{Z}_{\geq 0}$: peso de la regla en el presupuesto de preferencias del usuario $j$, con $\sum_{r \in \mathcal{R}_j} w_r^j = 100$. La fórmula de felicidad es invariante al factor común, así que el presupuesto fijo a 100 es convención de la UI, no requisito matemático.

### Parámetros globales

- $\tau \in \{1, 2, 3, 4, 5\}$: umbral mínimo de skill exigido para considerar que un usuario puede realizar una tarea que requiere esa skill (parámetro de configuración del sprint).
- $\varepsilon \in \mathbb{R}_{>0}$: constante pequeña empleada en el modo Nash (definida en §3.5) para evitar $\log(0)$.

### Equivalencia con el brief

| Notación matemática | Variable del brief / código |
| :--- | :--- |
| $x_{i,j}$ (definida en §3.2) | `assigned[i, j]` |
| $s_i$ | `start[i]` |
| $e_i$ | `effort_days[i]` |
| $\rho_i$ | `required_skills[i]` |
| $\delta_i$ | `deadline_day[i]` |
| $\sigma_{j,s}$ | nivel de skill |
| $w_r^j$ | peso de la regla |

## 3.2 Variables de decisión

El modelo emplea las siguientes variables de decisión:

- **Asignación.** $x_{i,j} \in \{0, 1\}$ para cada $i \in T$, $j \in U$. Vale $1$ si la tarea $i$ se asigna al usuario $j$ y $0$ en caso contrario.
- **Inicio.** $s_i \in H$ para cada $i \in T$. Día de inicio de la tarea $i$ en el horizonte.
- **Fin (derivada).** $\text{end}_i = s_i + e_i$ para cada $i \in T$. No es una variable libre; queda determinada por $s_i$ y el parámetro $e_i$.

Sobre estas variables se construyen los _intervalos opcionales_ del solver CP-SAT:

$$
\text{interval}_{i,j} = \text{OptionalIntervalVar}(s_i,\ e_i,\ \text{end}_i,\ x_{i,j})
$$

donde el intervalo está presente si y solo si $x_{i,j} = 1$. Esta construcción es la que permite expresar la restricción de no solapamiento por persona (R2 en §3.3) sin necesidad de variables booleanas auxiliares explícitas.

## 3.3 Restricciones duras (R1–R7)

Las siete restricciones duras del modelo se enumeran a continuación. Cada una se etiqueta `(3.k)` para referencia cruzada. La fuente literal de cada restricción es el brief §7.2.

**R1. Asignación única.** Cada tarea se asigna a exactamente un usuario:

$$
\sum_{j \in U} x_{i,j} = 1 \quad \forall i \in T \tag{3.1}
$$

**R2. No solapamiento por persona.** Para cada usuario $j$, los intervalos de las tareas asignadas a $j$ no se solapan en el tiempo:

$$
\text{NoOverlap}\bigl(\{\text{interval}_{i,j} : i \in T,\ x_{i,j} = 1\}\bigr) \quad \forall j \in U \tag{3.2}
$$

En términos lógicos elementales, para todo par $(i, k) \in T \times T$ con $i \neq k$ y todo $j \in U$:

$$
x_{i,j} \wedge x_{k,j} \implies (\text{end}_i \leq s_k) \vee (\text{end}_k \leq s_i)
$$

El solver CP-SAT modela esto eficientemente con la restricción global `AddNoOverlap` sobre los intervalos opcionales.

**R3. Horizonte.** Toda tarea termina dentro del horizonte:

$$
s_i + e_i \leq D \quad \forall i \in T \tag{3.3}
$$

**R4. Deadlines.** Las tareas con deadline asignada terminan a tiempo:

$$
s_i + e_i \leq \delta_i + 1 \quad \forall i \in T : \delta_i \neq \bot \tag{3.4}
$$

El "$+1$" refleja la convención del brief: $\delta_i$ es el último día (inclusive) en el que la tarea puede estar siendo trabajada.

**R5. Dependencias.** Si la tarea $k$ depende de la tarea $i$ (esto es, $i \in \text{dep}(k)$), entonces $k$ comienza después de que $i$ haya terminado:

$$
\text{end}_i \leq s_k \quad \forall k \in T,\ \forall i \in \text{dep}(k) \tag{3.5}
$$

**R6. Skill mínimo.** El brief §7.2 describe esta restricción en lenguaje natural: el usuario debe poseer cada skill requerida por la tarea con nivel mínimo, salvo que tenga una regla `LEARN_SKILL` que relaje el requisito. Adoptamos la siguiente convención formal. Sea $\Lambda_j \subseteq S$ el conjunto de skills que el usuario $j$ está aprendiendo (i.e., $s \in \Lambda_j$ sii $j$ tiene una regla `LEARN_SKILL` activa sobre $s$). Entonces:

$$
x_{i,j} = 1 \implies \bigl(\sigma_{j,s} \geq \tau\ \vee\ s \in \Lambda_j\bigr) \quad \forall i \in T,\ \forall j \in U,\ \forall s \in \rho_i \tag{3.6}
$$

Equivalentemente, en forma de restricción lineal aplicable directamente al solver, para todo $i \in T$, $j \in U$, $s \in \rho_i$:

$$
\sigma_{j,s} \geq \tau\ \vee\ s \in \Lambda_j\ \vee\ x_{i,j} = 0
$$

Esto se compila como una _channeling constraint_ que prohíbe la asignación cuando ninguna de las dos condiciones de competencia se cumple.

**R7. Reglas duras.** Cada regla con `is_hard = true` del catálogo del DSL se traduce a una restricción dura específica. Formalmente, para cada usuario $j$ y cada regla $r \in \mathcal{R}_j^{\text{hard}}$ existe una función de compilación $\Phi_r : \{\text{vars del modelo}\} \to \{\text{restricciones lineales o lógicas}\}$ tal que:

$$
\Phi_r(x, s) \quad \forall r \in \bigcup_{j \in U} \mathcal{R}_j^{\text{hard}} \tag{3.7}
$$

La semántica concreta de cada tipo de regla del catálogo (definido en el brief §6.3) está fuera del alcance de este capítulo: el catálogo enumera doce tipos (`PREFER_TASK_KIND`, `AVOID_TASK_KIND`, `MAX_TASKS_PER_SPRINT`, `LEARN_SKILL`, etc.) y la traducción de cada uno es responsabilidad del módulo `rule_compiler` del optimizador. Este capítulo abstrae esa traducción en el operador $\Phi_r$, dejando la semántica detallada al brief §6.3 como fuente única de verdad.

## 3.4 Función de felicidad por usuario

Para cada usuario $j$ con reglas blandas $\mathcal{R}_j^{\text{soft}} = \{r_1, \dots, r_{n_j}\}$, se define el _grado de cumplimiento_ de cada regla $c_{r}^{j} \in [0, 1]$ como una variable derivada del esquema de asignación $(x, s)$. El cumplimiento es **fraccional** en general: por ejemplo, una regla `PREFER_TASK_KIND(Python)` con peso $w$ se cumple con grado $c = 0.8$ si el 80 % de las tareas asignadas al usuario son de tipo Python.

La felicidad del usuario $j$ es el promedio ponderado de los cumplimientos de sus reglas blandas:

$$
f_j = \frac{\sum_{k=1}^{n_j} w_{r_k}^{j} \cdot c_{r_k}^{j}}{\sum_{k=1}^{n_j} w_{r_k}^{j}} \tag{3.8}
$$

Por construcción $f_j \in [0, 1]$: el numerador es una combinación cónica de valores en $[0, 1]$ acotada superiormente por el denominador. El caso degenerado $n_j = 0$ (usuario sin reglas blandas) se trata por convención como $f_j = 1$ (un usuario sin preferencias activas está perfectamente "satisfecho"). La fórmula es invariante al factor común de los pesos, por lo que la convención de presupuesto fijo a 100 (brief §6.2) no afecta a su valor.

## 3.5 Modos de equidad

La función objetivo global $F$ agrega las felicidades individuales $\{f_j\}_{j \in U}$ según uno de tres modos de equidad seleccionables por el usuario que lanza la planificación:

- **Utilitarista (suma).** Maximizar la suma de felicidades:

  $$
  F_{\text{util}} = \sum_{j \in U} f_j \tag{3.9}
  $$

  Maximiza la eficiencia global. Puede dejar a un usuario muy infeliz si compensa con otros muy felices.

- **Max-min (Rawlsiano).** Maximizar la felicidad mínima:

  $$
  F_{\text{maxmin}} = \min_{j \in U} f_j \tag{3.10}
  $$

  Protege al usuario menos satisfecho. En CP-SAT se modela introduciendo una variable auxiliar $\mu$ con restricciones $\mu \leq f_j\ \forall j$ y maximizando $\mu$.

- **Nash (producto, en logs).** Maximizar la suma de logaritmos:

  $$
  F_{\text{nash}} = \sum_{j \in U} \log\bigl(f_j + \varepsilon\bigr) \tag{3.11}
  $$

  Donde $\varepsilon > 0$ es una constante pequeña que evita $\log(0)$. Es equivalente a maximizar $\prod_j (f_j + \varepsilon)$ y representa el _equilibrio de bargaining_ de Nash: combina eficiencia y equidad penalizando fuertemente felicidades muy bajas sin sacrificar tanto la suma como el max-min.

CP-SAT opera sobre dominios enteros: las felicidades reales $f_j$ se aproximan multiplicando por un factor entero grande $K$ (típicamente $K = 1000$), y el logaritmo del modo Nash se aproxima con una tabla precomputada o una linealización por tramos. Los detalles de esta cuantización pertenecen a la implementación (módulo `optimizer/`), no al modelo formal.

## 3.6 Equivalencia de la formulación blanda

El brief §7.5 ofrece una formulación alternativa para el tratamiento de las reglas blandas: en lugar de calcular explícitamente $f_j$ y maximizar $F$ sobre las felicidades, propone (1) definir directamente las variables de cumplimiento $c_r^j$ como variables del modelo y (2) maximizar una suma ponderada de cumplimientos, normalizada por usuario y agregada según el modo elegido. A continuación demostramos que ambas formulaciones son equivalentes en términos del esquema de asignación óptimo.

**Formulación A (directa).** Maximizar $F(\{f_j\})$ donde $f_j$ se define por $(3.8)$ y $F$ se define por $(3.9)$, $(3.10)$ o $(3.11)$ según el modo.

**Formulación B (compilable).** Definir las variables $c_r^j$ como variables del modelo (con dominio $[0, 1]$ acotado por las restricciones lineales que define $\Phi_r$ para cada regla blanda) y maximizar:

$$
F_B = \mathrm{Agg}_{\text{modo}}\!\left(\left\{\frac{\sum_{k=1}^{n_j} w_{r_k}^j \cdot c_{r_k}^j}{\sum_{k=1}^{n_j} w_{r_k}^j}\right\}_{j \in U}\right)
$$

donde $\mathrm{Agg}_{\text{modo}}$ es la suma, el mínimo o la suma de logaritmos según el modo seleccionado.

**Proposición 3.1 (equivalencia).** Las formulaciones A y B son equivalentes: tienen el mismo conjunto de soluciones óptimas en las variables de asignación $(x, s)$.

**Demostración.** En la formulación A, $f_j$ es por definición la expresión que aparece en el argumento de $\mathrm{Agg}$ en la formulación B. La única diferencia es que en B los $c_r^j$ se declaran como variables del modelo en vez de evaluarse como expresiones derivadas. Como los $c_r^j$ están unívocamente determinados por $(x, s)$ a través de las restricciones $\Phi_r$ (que el compilador de reglas garantiza que son funcionales), la única solución factible de las variables $c_r^j$ para un $(x, s)$ dado coincide con su valor evaluado en A. Por tanto, el objetivo de B en el subespacio factible es idéntico al de A, y los óptimos coinciden. $\square$

La razón pragmática para preferir B en la implementación es que CP-SAT optimiza mejor cuando las variables de objetivo son nodos del DAG de restricciones del solver, en lugar de expresiones complejas evaluadas a posteriori. Esta elección de ingeniería no altera el modelo matemático.

## 3.7 Análisis de complejidad

### NP-dificultad

**Proposición 3.2.** El problema de decisión asociado al modelo de §3.2–3.5 — "¿existe un esquema de asignación $(x, s)$ que satisfaga R1–R7 con $F \geq F^*$?" — es NP-difícil.

**Demostración (esbozo).** Se construye una reducción polinómica desde el _Generalized Assignment Problem_ (GAP), conocido NP-difícil [1].

Una instancia de GAP consiste en un conjunto de tareas $T$, un conjunto de agentes $U$, costes $p_{i,j}$ y consumos $q_{i,j}$ para asignar la tarea $i$ al agente $j$, y capacidades $b_j$ para cada agente. El problema decide si existe una asignación que cubra todas las tareas sin exceder capacidades y minimice el coste total.

Dada una instancia de GAP $\mathcal{I}_{\text{GAP}} = (T, U, p_{i,j}, q_{i,j}, b_j)$, construimos una instancia $\mathcal{I}_{\text{SW}}$ de SprintWell del siguiente modo:

- Conservamos $T$ y $U$.
- Fijamos $D = \max_j b_j$ y $e_i = 1$ para toda tarea $i$, sin deadlines ($\delta_i = \bot$), sin dependencias ($\text{dep}(i) = \emptyset$) y sin skills requeridas ($\rho_i = \emptyset$). Esto inhabilita R3–R6 como restricciones efectivas más allá del horizonte.
- Para cada agente $j$ fijamos $c_j = b_j$. Las restricciones R1 (asignación única) y R2 (no solapamiento) garantizan que la suma de esfuerzos asignados a $j$ no excede $c_j$, lo que reproduce la restricción de capacidad de GAP cuando $q_{i,j} = 1$.
- Codificamos los costes $p_{i,j}$ como una única regla blanda por usuario del tipo `PREFER_*` con cumplimientos $c_r^j$ proporcionales a $-p_{i,j}$, escalados a $[0, 1]$. El modo utilitarista maximiza $\sum_j f_j$, lo que en esta construcción coincide con minimizar $\sum_{i,j} p_{i,j} \cdot x_{i,j}$.

La construcción es polinómica en $|T| + |U|$. Una asignación es factible y de coste $\leq C$ en GAP si y solo si la instancia SprintWell construida tiene una solución factible con $F_{\text{util}} \geq F^*(C)$, donde $F^*(C)$ es la imagen del umbral de coste bajo la codificación anterior. Una solución en tiempo polinómico al problema de decisión de SprintWell decidiría GAP en tiempo polinómico, lo que contradice la NP-dificultad de este último. $\square$

**Observación 3.3 (relación con RCPSP).** Cuando $e_i > 1$ y existen dependencias no triviales (`dep`), el problema generaliza también el _Resource-Constrained Project Scheduling Problem_ (RCPSP) descrito en Brucker et al. [2]. El caso particular en el que cada usuario es un recurso unitario renovable y las precedencias entre tareas son las dependencias $\text{dep}$ es exactamente RCPSP con un solo recurso por máquina y disponibilidad unitaria. Como RCPSP es también NP-difícil [2, §3], esta observación refuerza la Proposición 3.2 desde un segundo flanco.

La demostración formal completa de la reducción excede el alcance metodológico del Trabajo de Fin de Máster; se referencia el artículo seminal [1] para el caso base de GAP y [2] para el caso de RCPSP. La intención del capítulo es justificar la elección de un solver heurístico-completo (CP-SAT, [3]) por encima de un algoritmo polinómico exacto: no existe, salvo que P = NP.

## 3.8 Resumen del modelo

| Aspecto | Detalle |
| :--- | :--- |
| Variables principales | $x_{i,j} \in \{0,1\}$ (asignación), $s_i \in H$ (inicio) |
| Variables auxiliares | intervalos opcionales $\text{interval}_{i,j}$, cumplimientos $c_r^j \in [0,1]$ |
| Cardinalidad de variables | $\mathcal{O}(nm)$ binarias + $\mathcal{O}(n)$ enteras + $\mathcal{O}(\sum_j |\mathcal{R}_j^{\text{soft}}|)$ continuas cuantizadas |
| Restricciones duras | 7 familias (R1–R7), ver §3.3 |
| Restricciones blandas | reglas en $\bigcup_j \mathcal{R}_j^{\text{soft}}$, compiladas por $\Phi_r$ |
| Función objetivo | una de $F_{\text{util}}$, $F_{\text{maxmin}}$, $F_{\text{nash}}$ |
| Familia del objetivo | lineal (utilitarista), minimax (max-min), cóncava separable aproximable por tramos (Nash) |
| Clase de complejidad | NP-difícil (Proposición 3.2) |
| Solver de referencia | Google OR-Tools CP-SAT [3] |

## Referencias

1. Ross, G. T., & Soland, R. M. (1975). A branch and bound algorithm for the generalized assignment problem. _Mathematical Programming_, 8(1), 91–103.
2. Brucker, P., Drexl, A., Möhring, R., Neumann, K., & Pesch, E. (1999). Resource-constrained project scheduling: Notation, classification, models, and methods. _European Journal of Operational Research_, 112(1), 3–41.
3. Perron, L., & Furnon, V. OR-Tools v9.x: CP-SAT solver. Google. <https://developers.google.com/optimization/cp/cp_solver>
