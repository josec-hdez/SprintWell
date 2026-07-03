# Capítulo 2 — Estado del arte

Este capítulo revisa la frontera del conocimiento relevante para SprintWell y sitúa la contribución del trabajo frente a ella. Se organiza en cuatro áreas —planificación de sprints y herramientas comerciales, _scheduling_ basado en satisfacción/preferencias, equidad en optimización combinatoria, y programación con restricciones aplicada a asignación— y cierra posicionando el aporte del TFM en el hueco que la revisión hace visible. La bibliografía se consolida al final del capítulo (§2.6).

## 2.1 Planificación de sprints y herramientas comerciales

La planificación de sprints es, en la práctica industrial, un proceso semiestructurado que combina _backlog grooming_, estimación por puntos de historia y asignación por capacidad. Las herramientas dominantes —Jira [1], Linear [2], Asana [3], ClickUp [4], Azure DevOps [5]— modelan explícitamente dependencias entre tareas, capacidad por _sprint_ y prioridad de negocio, y ofrecen automatizaciones basadas en reglas ("_if_ campo X _then_ acción Y"). Sin embargo, ninguna expone un objetivo formal de **preferencias del trabajador**: la asignación final es una decisión humana del _team lead_, asistida por filtros y tableros pero no por un optimizador que pondere el bienestar individual.

La literatura académica sobre planificación ágil se ha centrado en la estimación (planning poker, _story points_) [6], la predicción de _velocity_ [7] y la priorización del _backlog_ mediante técnicas multicriterio como AHP o _Weighted Shortest Job First_ [8]. El _Software Project Scheduling Problem_ (SPSP) formaliza la asignación de empleados a tareas con restricciones de _skill_ y coste [9, 10], y se ha atacado con algoritmos genéticos [9], _ant colony_ [11] y programación por restricciones [12]. Estos trabajos optimizan coste, duración o robustez del cronograma, pero tratan al trabajador como un recurso intercambiable caracterizado por su _skill set_ y su coste/hora — no por sus preferencias.

## 2.2 Scheduling basado en satisfacción y preferencias

El _preference-based scheduling_ tiene tradición en dominios donde la satisfacción del personal es crítica: _nurse rostering_ [13, 14], asignación de turnos [15] y _course timetabling_ [16]. En el _Nurse Rostering Problem_, las preferencias (turnos deseados, días libres) se modelan típicamente como **restricciones blandas** penalizadas en la función objetivo, y se resuelven con metaheurísticas o programación entera [13]. La revisión de Van den Bergh et al. [15] sistematiza décadas de trabajo en _personnel scheduling_ y confirma que la satisfacción del empleado, cuando aparece, lo hace como término secundario, rara vez como objetivo de primer orden con tratamiento explícito de equidad.

En ingeniería del software, la evidencia sobre la relación entre satisfacción/bienestar y rendimiento es creciente pero dispersa: los estudios de productividad de desarrolladores [17, 18] y el marco SPACE [19] incluyen la satisfacción como dimensión, y trabajos sobre _flow_ y motivación intrínseca [20] sugieren que la alineación entre tarea y preferencia correlaciona con _throughput_ sostenido y retención. No obstante, esta evidencia no se ha traducido en un modelo formal de planificación de sprints que optimice contra preferencias declaradas: el hueco que SprintWell aborda (§1.1).

## 2.3 Equidad en optimización combinatoria

Optimizar el bienestar agregado plantea de inmediato la pregunta de **cómo agregar** utilidades individuales, un problema con raíces en la teoría de la elección social y la economía del bienestar. Tres criterios dominan la literatura y son precisamente los tres modos que implementa SprintWell:

- **Utilitarista** (suma de utilidades): maximiza el total, pero puede concentrar el bienestar en unos pocos y dejar a otros en cero. Es el criterio implícito de la mayoría de formulaciones de _scheduling_.
- **Max-min / igualitario** (maximizar el mínimo): inspirado en el principio de diferencia de Rawls [21], eleva al peor servido; formalizado en optimización como _max-min fairness_ [22] y estudiado en asignación de recursos en redes [23].
- **Nash** (producto de utilidades): la solución de negociación de Nash [24] equilibra eficiencia y equidad; en asignación se conoce como _Nash social welfare_ y ha recibido atención reciente por sus garantías de _fairness_ (envy-freeness aproximada, proporcionalidad) [25, 26].

La literatura de _fair division_ [26, 27] y de _fairness_ en aprendizaje automático [28] ha revitalizado estos criterios, pero su aplicación a la planificación de sprints con preferencias heterogéneas —donde cada trabajador tiene un presupuesto de reglas ponderadas— no está reportada. SprintWell contribuye una comparación empírica de los tres modos sobre el mismo problema (capítulo 7).

## 2.4 Programación con restricciones y CP-SAT

El problema de SprintWell es NP-difícil por reducción desde el _Generalized Assignment Problem_ [29, 30] (capítulo 3), lo que descarta algoritmos polinómicos exactos bajo P ≠ NP [31]. Las familias de enfoque son la programación entera mixta (MILP) [32], la programación con restricciones (CP) [33] y las metaheurísticas [34].

CP-SAT, el solver de Google OR-Tools [35], combina propagación de restricciones con aprendizaje de cláusulas (CDCL) heredado de los solucionadores SAT modernos [36] y búsqueda _lazy clause generation_ [37]. Es un solver **heurístico-completo**: garantiza optimalidad si dispone de tiempo, pero en la práctica devuelve soluciones factibles de alta calidad dentro de un presupuesto acotado, y reporta _bounds_ que permiten estimar el _gap_. Su rendimiento en problemas de _scheduling_ e _job-shop_ está bien documentado [38], y ha ganado repetidamente las competiciones MiniZinc [39]. Esta combinación —optimalidad cuando se puede probar, calidad interactiva cuando no— es la que motiva su elección frente a un MILP puro o una metaheurística ciega (capítulo 4).

## 2.5 Desarrollo de software asistido por IA

El tercer eje del TFM (H3) se apoya en la literatura emergente sobre programación asistida por modelos de lenguaje. Los estudios sobre GitHub Copilot y asistentes similares reportan ganancias de productividad en tareas acotadas [40, 41], pero también riesgos: introducción de defectos [42], sesgo de automatización y erosión de la comprensión ("_vibe coding_") [43]. La discusión sobre _prompt engineering_ y flujos agénticos [44] y sobre la evaluación de la calidad del código generado [45] es todavía joven. SprintWell aporta a este debate una **bitácora con métricas reales** (capítulo 6) de un sistema no trivial construido por una sola persona, en lugar de un experimento controlado de tareas de juguete.

## 2.6 Posicionamiento del aporte

La revisión hace visible un hueco preciso en la intersección de las cuatro áreas: **no existe un sistema de planificación de sprints que trate las preferencias del trabajador como objetivo de primer orden, con equidad inter-empleado seleccionable y explicabilidad por asignación, formalizado como optimización combinatoria y resuelto con un solver heurístico-completo**. Las herramientas comerciales (§2.1) no modelan preferencias; el _preference-based scheduling_ (§2.2) vive en otros dominios y trata la equidad de forma secundaria; la teoría de la equidad (§2.3) no se ha aplicado a este problema; y la literatura de CP-SAT (§2.4) no lo ha caracterizado sobre esta formulación.

SprintWell ocupa ese hueco con una contribución triple (§1.3.3): el **modelo de dominio** (preferencias como DSL de reglas ponderadas + tres modos de equidad), el **estudio algorítmico** (CP-SAT frente a baselines, benchmark reproducible) y la **bitácora metodológica** (uso auditable de IA). Los capítulos siguientes desarrollan cada eje.

## 2.7 Referencias

1. Atlassian (2024). _Jira Software documentation_.
2. Linear (2024). _Linear method_.
3. Asana (2024). _Work management guide_.
4. ClickUp (2024). _Product documentation_.
5. Microsoft (2024). _Azure DevOps Boards_.
6. Usman, M. et al. (2014). _Effort estimation in agile software development: a systematic literature review_. PROMISE.
7. Choetkiertikul, M. et al. (2018). _A deep learning model for estimating story points_. IEEE TSE.
8. Achimugu, P. et al. (2014). _A systematic literature review of software requirements prioritization_. Information and Software Technology.
9. Alba, E.; Chicano, F. (2007). _Software project management with GAs_. Information Sciences.
10. Chang, C. K. et al. (2008). _Time-line based model for software project scheduling_. Information and Software Technology.
11. Xiao, J. et al. (2013). _An ant colony optimization for the SPSP_. Journal of Systems and Software.
12. Barreto, A. et al. (2008). _Staffing a software project: a constraint satisfaction approach_. Computers & Operations Research.
13. Burke, E. K. et al. (2004). _The state of the art of nurse rostering_. Journal of Scheduling.
14. Cheang, B. et al. (2003). _Nurse rostering problems — a bibliographic survey_. EJOR.
15. Van den Bergh, J. et al. (2013). _Personnel scheduling: a literature review_. EJOR.
16. Schaerf, A. (1999). _A survey of automated timetabling_. Artificial Intelligence Review.
17. Forsgren, N. et al. (2018). _Accelerate: the science of lean software and DevOps_.
18. Meyer, A. N. et al. (2014). _Software developers' perceptions of productivity_. FSE.
19. Forsgren, N. et al. (2021). _The SPACE of developer productivity_. ACM Queue.
20. Ryan, R. M.; Deci, E. L. (2000). _Self-determination theory and intrinsic motivation_. American Psychologist.
21. Rawls, J. (1971). _A Theory of Justice_. Harvard University Press.
22. Bertsekas, D.; Gallager, R. (1992). _Data Networks_ (max-min fairness).
23. Radunović, B.; Le Boudec, J.-Y. (2007). _A unified framework for max-min and min-max fairness_. IEEE/ACM ToN.
24. Nash, J. F. (1950). _The bargaining problem_. Econometrica.
25. Caragiannis, I. et al. (2019). _The unreasonable fairness of maximum Nash welfare_. ACM TEAC.
26. Brandt, F. et al. (2016). _Handbook of Computational Social Choice_. Cambridge University Press.
27. Bouveret, S. et al. (2016). _Fair allocation of indivisible goods_ (survey).
28. Barocas, S.; Hardt, M.; Narayanan, A. (2019). _Fairness and Machine Learning_.
29. Fisher, M. L.; Jaikumar, R.; Van Wassenhove, L. N. (1986). _A multiplier adjustment method for the GAP_. Management Science.
30. Cattrysse, D. G.; Van Wassenhove, L. N. (1992). _A survey of algorithms for the GAP_. EJOR.
31. Garey, M. R.; Johnson, D. S. (1979). _Computers and Intractability_. W. H. Freeman.
32. Wolsey, L. A. (1998). _Integer Programming_. Wiley.
33. Rossi, F.; van Beek, P.; Walsh, T. (2006). _Handbook of Constraint Programming_. Elsevier.
34. Gendreau, M.; Potvin, J.-Y. (2010). _Handbook of Metaheuristics_. Springer.
35. Perron, L.; Furnon, V. (2023). _OR-Tools_. Google.
36. Marques-Silva, J. et al. (2009). _Conflict-driven clause learning SAT solvers_.
37. Ohrimenko, O.; Stuckey, P. J.; Codish, M. (2009). _Propagation via lazy clause generation_. Constraints.
38. Da Col, G.; Teppan, E. (2019). _Industrial-size job shop scheduling with CP-SAT_. 
39. Stuckey, P. J. et al. (2014). _The MiniZinc challenge_. Constraints.
40. Ziegler, A. et al. (2022). _Productivity assessment of neural code completion_. MAPS.
41. Peng, S. et al. (2023). _The impact of AI on developer productivity: evidence from GitHub Copilot_.
42. Pearce, H. et al. (2022). _Asleep at the keyboard? Assessing the security of Copilot's code_. IEEE S&P.
43. Sarkar, A. et al. (2022). _What is it like to program with artificial intelligence?_ PPIG.
44. Wang, L. et al. (2024). _A survey on large language model based autonomous agents_. Frontiers of Computer Science.
45. Chen, M. et al. (2021). _Evaluating large language models trained on code_ (HumanEval).
