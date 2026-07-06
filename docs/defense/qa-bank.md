# Banco de preguntas y respuestas — defensa SprintWell

Banco de Q&A simulado para preparar la defensa (soporte del issue #105). Anticipa las preguntas probables del tribunal con respuestas preparadas y honestas. El **ensayo (≥ 3 veces)** es un paso humano; este documento es el material sobre el que se ensaya.

## Sobre el modelo y la equidad

**P: ¿Por qué tres modos de equidad y no uno "correcto"?**
R: Porque la elección de agregación es una decisión de valores, no técnica: utilitarista prioriza eficiencia, max-min al peor servido, Nash el equilibrio. El aporte es hacerla **explícita y seleccionable**, frente al criterio utilitario implícito y oculto de las herramientas actuales. Empíricamente, Nash dio el mejor equilibrio en el caso de estudio, pero no lo imponemos.

**P: En sus resultados, max-min baja el piso en vez de subirlo. ¿No es eso un fallo?**
R: Es una divergencia que documentamos (Observación 3.1): el objetivo agrega los términos **absolutos** $\sum w_r c_r$ por tratabilidad lineal en CP-SAT, mientras el índice reportado es el $f_j$ **normalizado**. Coinciden si todos agotan el presupuesto de 100; divergen si no. La corrección —normalizar los términos del objetivo— es directa y está en trabajo futuro. Lo relevante es que lo detectamos y lo declaramos, no que lo escondimos.

**P: ¿`f_j` mide realmente el bienestar?**
R: Es una _proxy_: la fracción ponderada de reglas satisfechas. No es una medida psicométrica. Su validez de constructo depende de que las reglas capturen preferencias que importan, y eso solo un estudio con usuarios reales lo confirmaría — es nuestra principal amenaza de validez externa y la primera línea de trabajo futuro.

## Sobre la algoritmia

**P: ¿Por qué CP-SAT y no un MILP o una metaheurística?**
R: El problema es NP-difícil (reducción desde GAP), así que no hay algoritmo polinómico exacto. CP-SAT es heurístico-completo: prueba optimalidad si hay tiempo y devuelve calidad interactiva si no, con restricciones globales (`AddNoOverlap`) idiomáticas para este problema. Los baselines triviales sirven de referencia; una metaheurística adicional multiplicaría el benchmark sin cambiar la pregunta.

**P: Su solver no escala a la instancia XL. ¿No invalida eso H2?**
R: Acota su rango, no la invalida. H2 se sostiene sin reservas hasta ~150 tareas / 20 personas con utilitario y max-min. En XL y en Nash-grande el solver agota el presupuesto; lo declaramos como techo de escalabilidad. Un benchmark honesto debe exponer dónde deja de escalar, no ocultarlo. Vías de mejora: warm start desde el greedy, descomposición.

**P: ¿Los baselines no son demasiado débiles?**
R: Posible sesgo que mitigamos documentando su lógica exacta (capítulo 4) para que sean reproducibles y criticables. El greedy por skill-match equilibra carga, que es lo que un team lead haría sin herramienta; aun así, ignora preferencias y deja a alguien en 0.0.

## Sobre la metodología (IA)

**P: Si lo construyó una IA, ¿cuál es su aporte como autor?**
R: La dirección, la arquitectura, la revisión y la detección de errores. La IA ejecuta; el humano decide qué construir, con qué contrato, y **verifica** cada cambio. La evidencia son los huecos _upstream_ que detecté y corregí (instancias infactibles, endpoints faltantes): eso solo ocurre bajo revisión, no en aceptación ciega. La bitácora documenta el _cómo_.

**P: ¿No es esto "vibe coding"?**
R: Justo lo contrario, y es medible: 85 PRs trazables, 419 commits atómicos, CI en verde por PR, cobertura de test por capa, cada cambio ligado a un issue. El vibe coding es no auditable; este proceso es auditable línea a línea en el historial de Git.

## Sobre alcance y ética

**P: ¿Por qué datos sintéticos y no un equipo real?**
R: Restricción de alcance del TFM (12 semanas, un desarrollador) y consideraciones éticas propias de un estudio con personas (consentimiento, privacidad). El caso de estudio semi-realista compensa parcialmente; el estudio real es trabajo futuro.

**P: Optimizar el bienestar, ¿no es manipulable o invasivo?**
R: Riesgos reales que discutimos (capítulo 8): _gaming_ de reglas (mitigado por el presupuesto fijo y los modos de equidad), privacidad (las reglas son visibles al equipo por diseño — decisión debatible, reconsiderable con reglas privadas) y paternalismo (mitigado manteniendo al humano en el bucle vía explicabilidad y comparador). El sistema propone y justifica; no impone.

**P: ¿Qué harían distinto con más tiempo?**
R: Normalizar la agregación de equidad, persistir las evaluaciones de reglas para explicabilidad completa, un catálogo de skills para miembros, escalar el solver, y sobre todo un estudio con usuarios reales.

## Preguntas trampa / de fondo
- _"¿Es esto un producto o un experimento?"_ → Un MVP funcional con fronteras honestas; el producto pesa más que la memoria en la evaluación, pero no está probado en producción.
- _"¿Qué pasa si dos personas quieren la misma tarea?"_ → El objetivo de equidad y los pesos deciden; la explicabilidad muestra por qué.
- _"¿Y si un miembro no declara reglas?"_ → f_j = 1 por convención (perfectamente satisfecho); no penaliza no tener preferencias.

> **Pasos humanos pendientes (issue #105):** ensayar la defensa completa al menos 3 veces, cronometrando, con alguien haciendo de tribunal sobre este banco.
