# Capítulo 8 — Discusión, ética y limitaciones

Este capítulo lee críticamente los resultados del capítulo 7, examina las implicaciones éticas de optimizar el bienestar de un equipo y declara con honestidad las limitaciones del trabajo. El objetivo no es defender el sistema, sino someterlo al escrutinio que el tribunal hará: qué significan realmente los resultados, qué riesgos introduce automatizar esta decisión y dónde el trabajo se queda corto.

## 8.1 Discusión de los resultados

El resultado central es que **optimizar explícitamente contra las preferencias mejora de forma sustancial y medible el bienestar** frente a las heurísticas que hoy sustituyen a la herramienta: CP-SAT casi duplica la felicidad media y eleva el piso de `0.0` a un mínimo positivo (§7.3). Para un equipo real, ese piso importa más que la media: significa que ninguna persona queda con un sprint que ignora por completo sus preferencias.

La comparación de modos de equidad (§7.4) muestra que la elección de agregación **no es neutral**: reasigna trabajo de formas interpretables. Que Hugo (junior) pase del piso a la plena satisfacción al activar la equidad es el argumento de dominio del TFM hecho concreto. Nash emerge como el mejor equilibrio empírico en el caso de estudio, lo que sugiere un valor por defecto sensato — pero es un hallazgo sobre una instancia, no una ley.

El techo de escalabilidad (§7.2) tiene una lectura práctica importante: para equipos de hasta ~20 personas y ~150 tareas con objetivos utilitario o max-min, el sistema es interactivo y útil; más allá, o con Nash en instancias grandes, requeriría más presupuesto de tiempo, un _warm start_, o una descomposición del problema. Es una frontera honesta que acota el "tamaño realista" de H2.

## 8.2 Ética de optimizar el bienestar

Automatizar una decisión que hoy es una negociación humana introduce riesgos éticos que conviene nombrar, no minimizar:

- **_Gaming_ de las preferencias.** Si el bienestar se optimiza, hay incentivo a declarar reglas estratégicamente para capturar el trabajo deseado. El presupuesto fijo de 100 puntos (brief §6.2) obliga a priorizar —no se puede querer todo con máxima intensidad— y los modos de equidad limitan que un individuo monopolice su satisfacción a costa del resto. Pero la mitigación es parcial: un equipo maduro requiere además una norma social sobre el uso honesto del editor de reglas.
- **Privacidad de las reglas.** Las reglas codifican información personal: qué evita alguien, qué desea aprender, qué días rinde peor. El diseño las hace **visibles al equipo** (lectura pública, brief §10.1), una decisión deliberada —"la información del equipo no es secreta puertas adentro"— pero debatible: expone preferencias que un trabajador podría preferir mantener privadas, y abre la puerta a juicios de valor sobre ellas. Un despliegue real debería reconsiderar la visibilidad por defecto y permitir reglas privadas.
- **Paternalismo algorítmico.** Sustituir el juicio del _team lead_ por un optimizador puede erosionar la nuance humana (el "sé que esta semana necesitas algo tranquilo"). El sistema lo mitiga manteniendo a la persona en el bucle: la **explicabilidad** por asignación y el **comparador** de planificaciones convierten al optimizador en un asistente que propone y justifica, no en un oráculo que impone. La decisión final —qué modo de equidad, qué corrida aceptar— sigue siendo humana.
- **La equidad como elección de valores.** Elegir utilitarista, max-min o Nash es una decisión normativa, no técnica: prioriza la eficiencia, al peor servido o el equilibrio. Que el sistema la haga **explícita y seleccionable** es una virtud (frente al criterio utilitario implícito y oculto de las herramientas actuales), pero traslada al usuario una responsabilidad ética que antes estaba difusa. La herramienta no exime de decidir; obliga a decidir de forma consciente.

## 8.3 Limitaciones

Se declaran sin adorno:

1. **Validación con datos sintéticos.** No hay usuarios reales (brief §3): la validez externa es limitada. El caso de estudio es creíble pero ficticio; no sustituye a un estudio con un equipo real, que queda como trabajo futuro con sus propios requisitos éticos (consentimiento, anonimización).
2. **Techo de escalabilidad del solver.** CP-SAT no encuentra solución factible en la escala XL dentro de 30 s (§7.2). El rango validado de H2 es acotado.
3. **Divergencia de agregación de equidad.** El objetivo agrega términos absolutos, no el `f_j` normalizado (Observación 3.1), por lo que `max-min` puede no elevar el piso _reportado_. La corrección —normalizar los términos en el objetivo, o normalizar el índice para que coincida con lo optimizado— es directa y queda pendiente.
4. **Explicabilidad parcial.** Las `rule_evaluations` del solver no se persisten en el `PlanningRun`, así que el panel de explicabilidad muestra el conjunto de reglas del miembro y su `f_j`, no el flag satisfecho/no por regla. La columna de persistencia existe; es un _follow-up_ sin migración.
5. **Sin catálogo de skills para miembros.** El editor de reglas introduce `skill_id` como texto libre, con el riesgo de _typos_ que rompan el _match_. Un catálogo consultable por miembros lo resolvería.
6. **Sesgo metodológico de H3.** La bitácora la produce el mismo autor que dirige la IA: no es un experimento controlado con varios sujetos, sino un estudio de caso único. Sus métricas (85 PRs, 419 _commits_) son auditables, pero la generalización a otros desarrolladores o dominios es una hipótesis, no una conclusión.
7. **Alcance del benchmark.** El _benchmark_ commiteado usa una muestra (pocas escalas/semillas) por coste de cómputo; la malla completa (1080 corridas) se ejecuta bajo demanda con el script. Los resultados presentados son representativos, no exhaustivos.

## 8.4 Amenazas a la validez

- **Validez interna:** los baselines podrían estar mal calibrados (un _greedy_ más sofisticado reduciría la ventaja de CP-SAT); se mitiga documentando exactamente su lógica (capítulo 4) para que sean reproducibles y criticables.
- **Validez de constructo:** ¿mide `f_j` realmente "bienestar"? Es una _proxy_ —fracción ponderada de reglas satisfechas—, no una medida psicométrica. La validez del constructo depende de que las reglas capturen preferencias que importan, lo que sólo un estudio con usuarios confirmaría.
- **Validez externa:** datos sintéticos y un solo equipo ficticio; ya discutido en §8.3(1).

Nombrar estas amenazas no las resuelve, pero es condición para que el tribunal evalúe el trabajo por lo que es: un MVP riguroso con fronteras honestas, no un producto probado en producción.
