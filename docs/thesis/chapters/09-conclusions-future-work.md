# Capítulo 9 — Conclusiones y trabajo futuro

Este capítulo cierra la memoria: revisa el estado de cada hipótesis a la luz de la evidencia, evalúa el cumplimiento de los objetivos y traza las líneas de trabajo futuro que se derivan tanto de las exclusiones explícitas del alcance (§1.4) como de los hallazgos no anticipados durante la validación.

## 9.1 Conclusiones por hipótesis

**H1 (modelado) — validada.** Es posible expresar preferencias laborales heterogéneas mediante un DSL de reglas tratable como restricciones blandas. El catálogo de 12 tipos de regla cubre las preferencias habituales (por _skill_, categoría, dominio, día de la semana, tope de carga, foco, enfriamiento, aprendizaje) sin lenguaje natural libre ni extensiones ad-hoc, y el _rule compiler_ las traduce a términos que CP-SAT ingiere sin pérdida semántica (capítulos 4 y 7). El presupuesto fijo de 100 puntos obliga a priorizar y hace la formulación bien definida.

**H2 (algorítmica) — validada con matices.** CP-SAT alcanza calidad muy superior a los baselines (felicidad media ~0.81 frente a 0.44–0.49; ~30 puntos más de reglas satisfechas; piso positivo frente a `0.0`) y resuelve a óptimo o casi-óptimo las instancias de hasta ~150 tareas / 20 personas en tiempos interactivos. El matiz, declarado sin adorno: en la escala XL (200 tareas / 30 personas) y en el objetivo Nash de la escala grande, el solver agota el presupuesto de 30 s sin encontrar solución factible. El rango de "tamaño realista" para el que H2 se sostiene sin reservas queda, por tanto, caracterizado y acotado.

**H3 (metodológica) — validada con reservas.** Una sola persona construyó, asistida por IA, un sistema end-to-end de tres servicios con cobertura de test por capa y CI en verde, entregado en 85 PRs trazables y 419 _commits_ atómicos, dentro del plazo. La bitácora documenta el proceso con métricas auditables y, sobre todo, con los defectos _upstream_ detectados y corregidos en lugar de arrastrados (capítulo 6). La reserva es honesta: es un estudio de caso único, y la aceleración observada depende de una disciplina de verificación que el humano debe imponer; sin ella, la misma herramienta produciría _vibe coding_. La conclusión no es "la IA puede", sino "la IA puede **bajo revisión, tests y trazabilidad**".

## 9.2 Cumplimiento de los objetivos

Los tres ejes del objetivo general (§1.3.1) se cumplieron:

- **Producto:** un sistema web funcional y usable —backend DDD, optimizer CP-SAT, frontend con cliente tipado y e2e— que permite dar de alta un equipo, definir reglas, planificar un sprint con tres modos de equidad y explorar el resultado (Gantt, dashboard de bienestar, explicabilidad, comparador).
- **Algoritmia:** un estudio empírico de la formulación CP-SAT con _benchmark_ reproducible y baselines, que caracteriza rendimiento y calidad y expone el techo de escalabilidad.
- **Metodología:** una bitácora con métricas reales del desarrollo asistido por IA.

## 9.3 Trabajo futuro

Las líneas futuras se ordenan por cercanía a lo ya construido.

**Derivadas de hallazgos (correcciones acotadas):**

1. **Normalizar la agregación de equidad.** Resolver la divergencia de la Observación 3.1 haciendo que el objetivo opere sobre el `f_j` normalizado (o normalizando el índice reportado para que coincida con lo optimizado), de modo que `max-min` eleve efectivamente el piso reportado.
2. **Persistir `rule_evaluations`.** Plumar las evaluaciones por regla del optimizer al `PlanningRun` (la columna existe, sin migración) para que el panel de explicabilidad muestre el flag satisfecho/no por regla, completando el AC del panel.
3. **Catálogo de skills para miembros.** Un endpoint de _skills_ accesible al miembro para que el editor de reglas ofrezca un desplegable en vez de texto libre, eliminando _typos_ que rompan el _match_.
4. **Escalar el solver.** Para la escala XL y Nash: _warm start_ desde el baseline _greedy_, descomposición del problema por dominio, o presupuesto de tiempo adaptativo.

**Derivadas de las exclusiones del alcance (§1.4):**

5. **Estudio con usuarios reales.** La validación con un equipo real —con consentimiento, anonimización y métricas psicométricas de satisfacción— cerraría la principal amenaza de validez externa (§8.4) y permitiría contrastar si `f_j` es una _proxy_ adecuada del bienestar.
6. **Reglas privadas y gobernanza.** Reconsiderar la visibilidad por defecto de las reglas (§8.2), permitiendo reglas privadas y una política explícita de uso honesto del editor.
7. **Renegociación _mid-sprint_.** Re-optimización incremental con _warm start_ cuando cambian las condiciones a mitad de sprint.
8. **Extensiones opcionales:** NLP para asistir la redacción de reglas (manteniendo el DSL como destino), metaheurísticas adicionales como término de comparación, y multi-tenant/SSO para despliegue organizacional.

## 9.4 Reflexión final

SprintWell parte de una omisión concreta de las herramientas actuales —las preferencias del trabajador no son un objetivo de primer orden— y la convierte en un problema formal, un sistema funcional y un estudio empírico. El trabajo no proclama haber resuelto el bienestar de los equipos de software: demuestra que **modelarlo explícitamente es posible, mejora medible y auditablemente la asignación frente a las heurísticas actuales, y plantea decisiones —de equidad, de privacidad, de escala— que merecen ser tomadas de forma consciente** en lugar de quedar implícitas. Que esas decisiones queden expuestas y explicables, y no ocultas en el criterio de una herramienta o en la sensibilidad de un _team lead_, es quizás la contribución más duradera del trabajo. El resto —los tres modos de equidad, el benchmark, la bitácora— son la evidencia de que el planteamiento se sostiene.
