# Capítulo 1 — Introducción

Este capítulo introduce el problema que aborda SprintWell, motiva su pertinencia académica y práctica, fija los objetivos y las hipótesis falseables del Trabajo de Fin de Máster, delimita su ámbito explícito y traza la estructura del resto de la memoria. Sigue, en intención y alcance, los puntos enumerados en el brief del proyecto (brief §1 y §2), elevándolos a discurso de memoria sin alterar su contenido sustantivo: cuando esta introducción se aparte del brief, deberá actualizarse primero el brief.

## 1.1 Motivación

Las herramientas actuales de planificación de proyectos software —Jira, ClickUp, Linear, Asana— optimizan, de forma implícita o explícita, por criterios operativos: capacidad del equipo, dependencias entre tareas, prioridad de negocio y, en el mejor de los casos, _skill match_ entre el perfil técnico exigido y el de los miembros del equipo (brief §1). Las **preferencias individuales del trabajador** —tipo de tarea preferido, días de la semana en que rinde mejor, dominios de interés, modalidades de guardia, intención explícita de aprender una nueva tecnología— quedan sistemáticamente fuera del modelo formal. Cuando se atienden, ocurre de manera ad-hoc: en una conversación informal con el _team lead_, en un Slack privado, en una hoja de cálculo manual que se mantiene en paralelo a la herramienta principal.

Esta omisión no es neutral. La literatura reciente sobre satisfacción laboral en equipos de software sugiere que la alineación entre las tareas asignadas y las preferencias individuales correlaciona con métricas duras de rendimiento (retención, calidad del código, _throughput_ sostenido). Sin embargo, los modelos formales de planificación con los que conviven los equipos de desarrollo no exponen un mecanismo de primer orden para declarar y optimizar contra esas preferencias. El resultado es un sesgo estructural hacia lo operativamente medible: capacidad, _deadline_, skill — todo lo demás es ruido al que el _team lead_ se enfrenta manualmente y sin garantías de equidad.

**SprintWell** propone llenar exactamente ese hueco: un sistema de planificación de sprints que incorpora un modelo formal de preferencias del trabajador como un objetivo de primer orden, junto a las restricciones operativas clásicas. El problema resultante es un problema de optimización combinatoria multiobjetivo, conocido como **NP-difícil** por reducción desde el _Generalized Assignment Problem_ con restricciones adicionales (brief §1; se demuestra formalmente en el capítulo 3 de esta memoria). La NP-dificultad no es un detalle técnico: justifica el estudio comparativo de enfoques algorítmicos que articula el aporte central del trabajo, y descarta de entrada cualquier ilusión de "fórmula cerrada" para la asignación de sprints.

El "bienestar del equipo" merece, por tanto, un lugar de primer orden en el modelo formal por dos motivos convergentes. **Académicamente**, completa una formulación que las herramientas comerciales han dejado parcial y permite estudiarla con el rigor que requiere una memoria de máster. **Prácticamente**, automatiza una negociación que hoy depende de la sensibilidad y la disponibilidad del _team lead_, y la sustituye por un procedimiento auditable cuyas decisiones pueden explicarse, comparase entre planificaciones alternativas y, eventualmente, mejorarse iterativamente.

## 1.2 Contexto

Este trabajo se sitúa en el marco de un Trabajo de Fin de Máster, sometido a tres restricciones estructurales que conviene declarar desde el inicio para enmarcar correctamente las decisiones del resto de la memoria (brief §3):

1. **Plazo de doce semanas efectivas** de desarrollo, contadas a partir del kickoff y entendidas como tiempo neto de implementación (no incluye anteproyecto ni preparación de la defensa).
2. **Equipo de una sola persona**: el autor de la memoria es el único desarrollador, lo cual recorta de inicio cualquier división del trabajo en frentes paralelos y obliga a priorizar la disciplina metodológica sobre la fuerza bruta del esfuerzo.
3. **Validación con datos sintéticos**, no con un equipo de usuarios reales (brief §2.4). El estudio con usuarios reales se excluye explícitamente del ámbito del MVP y se difiere a trabajo futuro.

En este marco, la contribución del TFM es deliberadamente triple, y los tres ejes no son intercambiables: ninguno está pensado como ornamento del otro.

- **Un sistema web funcional** end-to-end: tres servicios (backend NestJS con arquitectura DDD en cuatro capas, optimizer en Python con OR-Tools/CP-SAT, frontend React) que un usuario puede levantar, alimentar con un dataset sintético y usar para planificar un sprint con tres modos de equidad. El producto pesa más que la memoria en la evaluación (brief §3), de modo que el sistema no es un _toy_: es la entrega central.
- **Un estudio algorítmico** de la formulación CP-SAT del problema, con benchmark sintético reproducible frente a baselines triviales (asignación aleatoria, _greedy_ por skill-match). Este eje justifica la elección de solver heurístico-completo por encima de cualquier algoritmo polinómico exacto inexistente bajo el supuesto P ≠ NP.
- **Una bitácora metodológica** del proceso de desarrollo asistido por IA, con métricas reales sobre cobertura, productividad y calidad. Este aporte es el menos convencional para una memoria de máster en informática, pero es justamente lo que permite responder con datos —y no con anécdotas— la pregunta de si una sola persona puede construir hoy un sistema de esta complejidad en un plazo acotado.

Estos tres ejes se reflejan en la estructura de la memoria (§1.5) y en las tres hipótesis falseables del trabajo (§1.3.2): una por eje.

## 1.3 Objetivos

### 1.3.1 Objetivo general

Diseñar, implementar y validar un sistema web de planificación de sprints que optimice la asignación de tareas considerando simultáneamente (brief §2.1):

1. Las restricciones operativas del equipo (capacidad, dependencias, deadlines, skills).
2. Las preferencias declaradas de cada trabajador.
3. Criterios de equidad inter-empleado.

Formalizando el problema como una optimización combinatoria multiobjetivo y documentando rigurosamente el uso de herramientas de IA en todas las fases del desarrollo.

El objetivo general se descompone en los tres ejes que estructuran la memoria —producto, algoritmia, metodología— y se concreta en hipótesis falseables que pueden contrastarse al cierre del trabajo.

### 1.3.2 Hipótesis falseables

La memoria sostiene tres hipótesis falseables, una por eje del trabajo (brief §2.2). Cada una está formulada de modo que sea posible declararla refutada con evidencia empírica al final del trabajo.

**H1 (modelado).** Es posible expresar preferencias laborales heterogéneas mediante un _DSL_ de reglas que cubra los casos típicos de un equipo de desarrollo, manteniendo la formulación tratable como restricciones blandas dentro de un modelo de optimización. La hipótesis se valida si el catálogo de reglas del DSL (brief §6.3) cubre, sin lenguaje natural libre y sin extensiones ad-hoc, las preferencias que la literatura y la práctica reportan como habituales, y si el _rule compiler_ produce restricciones lineales o lógicas aceptables por CP-SAT sin pérdida de información semántica.

**H2 (algorítmica).** Existen formulaciones (CP-SAT) que, en instancias de tamaño realista —10 a 30 personas, 50 a 200 tareas por sprint—, encuentran soluciones de calidad comparable al óptimo en tiempos compatibles con uso interactivo (< 30 s por planificación). La hipótesis se valida si el _benchmark_ sintético reproducible del capítulo 7 muestra que CP-SAT, en al menos un percentil alto de las instancias generadas, alcanza el _gap_ objetivo dentro del presupuesto de tiempo. Se refuta si el solver requiere tiempos no interactivos o si la calidad cae por debajo de un umbral pactado frente a los baselines.

**H3 (metodológica).** Un proceso de desarrollo asistido por IA permite construir un sistema de esta complejidad por una sola persona en el plazo de un TFM, con métricas de productividad y calidad documentables. La hipótesis se valida si la bitácora del capítulo 6 documenta, con métricas reales y no anecdóticas, el cumplimiento del plazo de doce semanas, la cobertura de test alcanzada y el cumplimiento de las prácticas declaradas (revisión de cada PR, no _commits_ sin issue, etc.). Se refuta si el TFM no se cierra en plazo o si las métricas evidencian que el proceso degenera en _vibe coding_ no auditable.

### 1.3.3 Aportes esperados

Se identifican tres aportes esperados, alineados con las tres hipótesis y los tres ejes (brief §2.3):

1. **Aporte de dominio.** Un modelo formal y un sistema funcional para incorporar preferencias del trabajador a la planificación de sprints, con tratamiento explícito de la equidad bajo tres modos seleccionables (utilitarista, max-min y Nash; ver capítulo 3). El modelo no es una _wishlist_: es una formulación matemática (variables, restricciones duras R1–R7, función objetivo) que un solver puede ingerir sin reinterpretación.
2. **Aporte algorítmico.** Un estudio de la formulación CP-SAT del problema, con _benchmark_ sintético reproducible y comparación frente a baselines triviales (asignación aleatoria, _greedy_ por skill-match). El aporte no consiste en proponer un solver nuevo, sino en caracterizar empíricamente el rendimiento de uno existente sobre el problema concreto que se ha formalizado.
3. **Aporte metodológico.** Un protocolo documentado y métricas reales sobre el uso de IA en el desarrollo de un sistema no trivial por un único desarrollador. Este aporte es el más sensible a la moda y, por eso mismo, el más comprometido con métricas duras: tiempo de desarrollo por feature, cobertura de test, número de revisiones humanas por PR, decisiones revertidas, etc.

## 1.4 Ámbito y exclusiones

El ámbito del trabajo está deliberadamente acotado. Las exclusiones que siguen no son omisiones por descuido: son decisiones tomadas para que las doce semanas alcancen, y se explicitan aquí para anticipar las preguntas naturales del tribunal (brief §2.4).

**Dentro del alcance del MVP** (lo que sí se construye):

- Sistema web end-to-end usable, con tres servicios (backend, optimizer, frontend).
- Editor de reglas con DSL estructurado, sin lenguaje natural libre.
- Motor de optimización con CP-SAT y los tres modos de equidad.
- Baselines: asignación aleatoria y _greedy_ por skill-match, contra los que se mide CP-SAT.
- Generador de datasets sintéticos parametrizable.
- Benchmark reproducible.
- Vista de explicabilidad por asignación.
- Comparador entre planificaciones alternativas.
- Bitácora metodológica del uso de IA.

**Fuera del alcance** (decisiones cerradas, no se discuten):

| Exclusión | Justificación |
| :--- | :--- |
| Multi-tenant / SSO / autenticación federada | Coste de implementación desproporcionado para un MVP de un solo equipo en una organización; login simple usuario/contraseña basta. |
| Entrenamiento de modelos de ML propios | La calidad del aporte está en la formulación combinatoria, no en aprender heurísticas; añadir ML diluiría el foco. |
| NLP para parsear reglas en lenguaje natural | El editor estructurado es suficiente; el NLP introduce un problema de robustez propio que excede el TFM. |
| Renegociación dinámica mid-sprint | Aumenta la complejidad del modelo (re-optimización con _warm start_) sin aportar a la hipótesis central; se difiere. |
| Metaheurísticas adicionales (recocido, genéticos) | Solo CP-SAT más baselines triviales; agregar más solvers multiplicaría el _benchmark_ sin mejorar la pregunta de investigación. |
| Implementación de un ILP propio | La formulación entra en la memoria como teoría (capítulo 3); el código usa OR-Tools. |
| Estudio con usuarios reales | Validación con datasets sintéticos; el estudio cualitativo excede el plazo y plantea problemas éticos propios. |
| Gestión de portafolio multi-proyecto, facturación, control horario, RR. HH. | No es parte del problema de planificación de sprints. |

Cada exclusión está blindada: si una de ellas resultara relevante a posteriori, se anotará como trabajo futuro en el capítulo 8 y se justificará por qué no entraba en el ámbito original.

## 1.5 Estructura de la memoria

El resto de la memoria sigue el orden natural del problema: primero la revisión de la literatura, después la formalización matemática, luego el diseño algorítmico y el sistema implementado, la bitácora metodológica, la validación empírica, la discusión y, finalmente, las conclusiones. Al cierre de esta introducción el MVP está implementado y validado, de modo que los capítulos ya no describen trabajo pendiente sino trabajo realizado: la memoria consolida lo construido.

- **Capítulo 2 — Estado del arte.** Revisión de la literatura sobre planificación de sprints, _satisfaction-based scheduling_, _fairness_ en optimización combinatoria y herramientas comerciales de gestión de proyectos. Posiciona la contribución del TFM frente a la frontera del conocimiento existente.
- **Capítulo 3 — Modelo formal del problema.** Conjuntos índice, parámetros, variables de decisión, las restricciones duras (R1–R7), la función de felicidad por usuario, los tres modos de equidad (utilitarista, max-min, Nash) y el análisis de NP-dificultad por reducción desde el _Generalized Assignment Problem_.
- **Capítulo 4 — Diseño algorítmico.** De la formulación del capítulo 3 al modelo CP-SAT ejecutable: variables booleanas de asignación e intervalos de tiempo, el _rule compiler_ que traduce el DSL de reglas a términos lineales/lógicos, la agregación por modo de equidad y los baselines (aleatorio, _greedy_ por skill-match) contra los que se mide.
- **Capítulo 5 — Sistema implementado.** Arquitectura en tres servicios: un _backend_ NestJS con DDD en cuatro capas (presentation, application, domain, infrastructure), un _optimizer_ en Python con OR-Tools/CP-SAT y un _frontend_ React con cliente tipado generado desde el OpenAPI del backend. Contratos entre servicios, persistencia, _tooling_ y las desviaciones del diseño teórico con su justificación.
- **Capítulo 6 — Metodología de desarrollo asistido por IA.** La bitácora del proceso con análisis: protocolo de uso de IA (cuándo se delega, cuándo se revisa, cuándo se rechaza la sugerencia), métricas de productividad y calidad, decisiones revertidas y _prompts_ representativos. Es el aporte metodológico declarado en §1.3.3 y contrasta H3.
- **Capítulo 7 — Validación y resultados.** _Benchmark_ sintético reproducible: CP-SAT frente a asignación aleatoria y _greedy_ por skill-match sobre instancias parametrizadas (4 escalas × 3 modos de equidad × múltiples semillas). Tiempos, calidad, felicidad media/mínima, satisfacción de reglas y un caso de estudio semi-realista. Aquí se contrasta H2 con datos.
- **Capítulo 8 — Discusión, ética y limitaciones.** Lectura crítica de los resultados, implicaciones éticas de optimizar el bienestar (riesgo de _gaming_ de las preferencias, privacidad de las reglas, paternalismo algorítmico) y las limitaciones honestas del trabajo (datos sintéticos, escala del solver, métricas no persistidas).
- **Capítulo 9 — Conclusiones y trabajo futuro.** Cierre: cuáles de H1, H2 y H3 quedaron validadas, cuáles matizadas y con qué evidencia. Líneas de trabajo futuro derivadas de las exclusiones explícitas de §1.4 y de los hallazgos no anticipados durante la validación.

La memoria está pensada para leerse en orden, pero los capítulos 3 (formal) y 6 (metodológico) son razonablemente autocontenidos y pueden leerse por separado por un lector interesado en uno solo de los aportes del trabajo.

## 1.6 Referencias

Las referencias se citan de forma abreviada a lo largo de la memoria y se consolidan aquí en su versión mínima; el capítulo 2 amplía la discusión bibliográfica.

- Fisher, M. L.; Jaikumar, R.; Van Wassenhove, L. N. (1986). _A multiplier adjustment method for the generalized assignment problem_. Management Science 32(9). — Base de la reducción de NP-dificultad (capítulo 3).
- Garey, M. R.; Johnson, D. S. (1979). _Computers and Intractability: A Guide to the Theory of NP-Completeness_. — Marco de la NP-dificultad.
- Nash, J. F. (1950). _The bargaining problem_. Econometrica 18(2). — Fundamento del modo de equidad Nash (producto de utilidades).
- Rawls, J. (1971). _A Theory of Justice_. — Fundamento del criterio max-min (mejorar al peor servido).
- Perron, L.; Furnon, V. (2023). _OR-Tools_, Google. — Solver CP-SAT empleado por el optimizer.
- Storey, M.-A. et al. (2021). _Software developer productivity and well-being_. — Evidencia sobre la relación entre preferencias/bienestar y rendimiento (motivación, §1.1).
