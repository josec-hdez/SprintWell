# Presentación de defensa — SprintWell (15–20 min)

Guion de diapositivas para la defensa del TFM (issue #103). Cada sección es una diapositiva con su contenido y una nota de tiempo. Total objetivo: **~17 min** de exposición + Q&A. Renderizable a slides con Pandoc/Marp; aquí es la fuente en Markdown.

> Regla de oro de tiempo: no más de ~1 min por diapositiva de contenido; las de resultados admiten 2 min. Si algo se alarga, se recorta el estado del arte, nunca la demo ni los resultados.

---

## 1. Portada (0:30)
- **SprintWell** — Planificación de sprints que optimiza el bienestar del equipo.
- Autor, tutor, máster, fecha.
- Una frase gancho: _"Las herramientas de hoy optimizan capacidad y deadlines; las preferencias del trabajador quedan fuera del modelo. Este TFM las mete dentro."_

## 2. El problema (1:30)
- Jira/Linear/Asana modelan capacidad, dependencias, prioridad, skill — **no** preferencias del trabajador.
- Cuando se atienden, es ad-hoc: Slack, hoja de cálculo, sensibilidad del _team lead_.
- Consecuencia: sesgo hacia lo medible; inequidad silenciosa (alguien siempre carga con lo que nadie quiere).

## 3. La propuesta y las 3 hipótesis (1:30)
- SprintWell: preferencias como **objetivo de primer orden** + equidad seleccionable.
- **H1 (modelado)**: un DSL de reglas cubre las preferencias típicas de forma tratable.
- **H2 (algorítmica)**: CP-SAT resuelve instancias realistas con calidad interactiva.
- **H3 (metodológica)**: una persona + IA construye esto en un TFM, con métricas.

## 4. Contexto y alcance (1:00)
- 12 semanas, un desarrollador, datos sintéticos.
- Contribución triple: **producto** (pesa más), **algoritmia**, **metodología**.
- Exclusiones deliberadas (multi-tenant, NLP, usuarios reales) — no descuidos.

## 5. Modelo formal (2:00)
- Variables: asignación $x_{ij}$, inicio $s_i$; duras R1–R7.
- Felicidad $f_j = \sum w_r c_r / \sum w_r \in [0,1]$.
- **Tres modos de equidad**: utilitarista (suma), max-min (Rawls), Nash (producto).
- **NP-difícil** por reducción desde GAP → justifica solver heurístico-completo (no hay fórmula cerrada).

## 6. Arquitectura (1:30)
- Tres servicios: backend NestJS DDD (4 capas, fronteras verificadas por lint) · optimizer Python CP-SAT (sin estado, CLIs) · frontend React con **cliente tipado generado desde el OpenAPI**.
- Diagrama de las tres cajas + contratos (OpenAPI, ProblemInput/SolverOutput).

## 7. DEMO EN VIVO (4:00) — el corazón
- Ver `demo-script.md`. Flujo: login admin → crear sprint + tareas → editor de reglas de un miembro (presupuesto en vivo) → **planificar con Nash** → Gantt + dashboard de bienestar → **comparar Nash vs utilitario** (el momento "equidad importa") → explicabilidad de un miembro.
- Si algo falla: **vídeo de respaldo** (issue #104).

## 8. Resultados (2:30)
- **CP-SAT vs baselines**: felicidad media 0.81 vs 0.44–0.49; reglas 82% vs ~51–55%; **piso positivo vs 0.0**.
- **Modos de equidad** (caso Apollo): Nash mejor equilibrio (media 0.87, piso 0.60); Hugo el junior pasa de 0.50 a 1.00 al activar equidad.
- **Escalabilidad honesta**: resuelve hasta ~150 tareas/20 personas; techo en XL y Nash-grande.
- 1 figura: barras de felicidad por persona bajo los 3 modos.

## 9. Metodología IA (1:30)
- 85 PRs, 419 commits atómicos, CI en verde, cobertura por capa.
- Delegar / **revisar** / rechazar; huecos _upstream_ detectados (instancias infactibles, endpoints faltantes) y corregidos → **no vibe coding**.

## 10. Conclusiones (1:30)
- H1 validada; H2 validada con matices (rango acotado); H3 validada con reservas (caso único, disciplina obligatoria).
- Aporte más duradero: hacer **explícitas y explicables** las decisiones de equidad y preferencia, antes ocultas.

## 11. Trabajo futuro (0:30)
- Normalizar equidad (Obs. 3.1), persistir rule_evaluations, escalar el solver (warm start), **estudio con usuarios reales**, reglas privadas.

## 12. Cierre + gracias (0:30)
- Repite la frase gancho cerrada: _"Preferencias dentro del modelo, decisiones de equidad a la vista."_
- Abrir a preguntas → ver `qa-bank.md`.

---

### Notas de entrega
- **Presupuesto**: ~17 min contenido, deja 3 min de colchón.
- **Prioridades si el tiempo aprieta**: proteger demo (7) y resultados (8); recortar estado del arte y arquitectura.
- **Transiciones**: cada sección termina anclando en la hipótesis que soporta.
