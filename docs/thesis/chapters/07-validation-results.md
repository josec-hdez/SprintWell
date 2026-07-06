# Capítulo 7 — Validación y resultados

Este capítulo contrasta empíricamente las hipótesis H1 (cobertura del DSL) y H2 (rendimiento del solver) con un _benchmark_ sintético reproducible y un caso de estudio semi-realista. Todos los datos provienen de ejecutar el _optimizer_ sobre instancias generadas con semillas documentadas; los artefactos (script del _benchmark_, notebook de análisis, instancias, caso de estudio) viven en `benchmarks/` y `docs/case-study/` y son reproducibles con un comando.

## 7.1 Metodología del benchmark

El _benchmark_ (`benchmarks/scripts/run_benchmark.py`) barre una malla de instancias fijas × algoritmos × modos de equidad × semillas, invocando la **CLI del optimizer como subproceso** (nunca el backend) para aislar la medición. Las instancias cubren **4 escalas** (`s1_small` 5×30, `s2_medium` 10×80, `s3_large` 20×150, `s4_xl` 30×200, usuarios × tareas) × **3 modos de equidad**, con horizontes dimensionados a ~65–72 % de utilización de capacidad para que sean factibles pero no triviales. Por cada corrida se registran: estado, valor objetivo, tiempo de resolución (`wall_time_ms` del propio solver), felicidad media/mín/máx, % de reglas blandas satisfechas y % de _deadlines_ cumplidos.

Un hallazgo metodológico precede a los resultados: las instancias fijas iniciales resultaban **100 % infactibles** por un defecto del generador (§6.4). Corregido el generador —_skills_ requeridas muestreadas del conjunto de un usuario real, redundancia de ≥ 2 portadores por _skill_, _deadlines_ en la segunda mitad del sprint y nunca sobre tareas con dependencias—, las instancias pasan a ser **factibles por construcción**, condición sin la cual no habría nada que comparar.

## 7.2 Factibilidad y escalabilidad de CP-SAT

Con presupuesto de 30 s, el comportamiento de CP-SAT por escala es:

| Escala | Resultado típico (CP-SAT) |
| :--- | :--- |
| `s1_small` | `OPTIMAL` (max-min) / `TIMEOUT` con solución completa (util, nash) |
| `s2_medium` | `OPTIMAL` (max-min) / `TIMEOUT` con solución completa |
| `s3_large` | `TIMEOUT` con solución completa (util, max-min); sin solución en `nash` |
| `s4_xl` | `TIMEOUT` sin solución factible dentro del presupuesto |

La lectura es matizada y honesta: CP-SAT **resuelve a óptimo** las instancias pequeñas/medianas bajo el objetivo max-min y devuelve **soluciones factibles** (aunque no probadas óptimas) en la mayoría de las grandes; pero en la escala XL, y en `nash` de la grande, **agota el presupuesto sin encontrar una solución factible**. Esto no es un defecto de las instancias (los baselines construyen un plan al instante; la instancia es demostrablemente factible), sino un **techo de escalabilidad del solver** con el objetivo de equidad, que es exactamente lo que un _benchmark_ debe exponer. El objetivo Nash, por su linealización logarítmica, es el más costoso.

## 7.3 CP-SAT frente a los baselines

Sobre las escalas donde CP-SAT encuentra solución, la comparación de **calidad** frente a los baselines es contundente. En la muestra de instancias pequeñas/medianas y en el caso de estudio (§7.5), con objetivo utilitario:

| Algoritmo | Felicidad media | Felicidad mín | Reglas satisfechas |
| :--- | :--- | :--- | :--- |
| **CP-SAT** | **0.81** | **0.50** | **81.8 %** |
| _greedy_ (skill-match) | 0.49 | 0.00 | 55.2 % |
| aleatorio | 0.44 | 0.00 | 51.0 % |

CP-SAT casi duplica la felicidad media de los baselines y satisface ~30 puntos porcentuales más de reglas blandas. Lo más relevante para un equipo real es el **piso**: los baselines dejan a alguien en felicidad `0.0` —un miembro cuyo sprint ignora por completo sus preferencias—, mientras que CP-SAT garantiza un mínimo positivo. El coste es tiempo de cómputo (decenas de milisegundos a esta escala), irrelevante para uso interactivo.

## 7.4 Efecto del modo de equidad

La misma instancia (caso Apollo, §7.5) resuelta a óptimo bajo los tres modos:

| Modo | Felicidad media | Felicidad mín | Reglas satisfechas |
| :--- | :--- | :--- | :--- |
| `utilitarian` | 0.81 | 0.50 | 81.8 % |
| `max-min` | 0.71 | 0.33 | 74.0 % |
| **`nash`** | **0.87** | **0.60** | **87.5 %** |

Nash logra a la vez la mayor media, el piso más alto y la mayor satisfacción de reglas: es el mejor equilibrio en esta instancia. Sorprende que `max-min` muestre la media más baja y un piso _normalizado_ (0.33) por debajo del utilitario (0.50). No es un error de medición sino la **divergencia entre agregación absoluta y normalizada** formalizada en la Observación 3.1: el objetivo maximiza el peor término absoluto $\tilde f_j = \sum_r w_r c_r$, mientras el índice reportado es el $f_j$ normalizado por el peso total del usuario. Cuando los usuarios cargan pesos totales distintos, ambos órdenes no coinciden, y `max-min` reordena quién queda peor servido en el índice normalizado. El capítulo 8 recoge esto como limitación con su corrección (normalizar los términos de equidad).

## 7.5 Caso de estudio Apollo

Para dar "textura humana" a los números (brief §13.3), se construyó un equipo ficticio creíble de 10 personas (`benchmarks/instances/case-study.json`) con bios, _skills_ y reglas plausibles, y 24 tareas con dependencias y _deadlines_. Resuelto con los 3 algoritmos × 3 modos, ilustra el aporte de dominio para personas concretas:

- **Hugo, el junior.** Bajo `utilitarian` queda en el piso (0.50): el modelo no pierde total dejándolo sin sus tareas de aprendizaje, así que no lo prioriza. En cuanto la equidad entra en juego (`max-min`, `nash`), su regla `LEARN_SKILL` se respeta y sube a 1.00. Es el caso de uso que justifica los modos de equidad: proteger a quien el agregado dejaría atrás.
- **Diego, de guardia.** Se mantiene en la franja media porque su ausencia dura (regla `BLACKOUT_DATE`) y su preferencia por `infra` compiten por los mismos días; su caída bajo `max-min` es la manifestación de la Observación 3.1.

El caso de estudio se acompaña de figuras (felicidad por persona bajo cada modo, CP-SAT vs. baselines) en `docs/case-study/`, y confirma cualitativamente que cambiar el modo de equidad **reasigna** de forma interpretable, no aleatoria.

## 7.6 Contraste de las hipótesis

- **H1 (modelado) — validada.** El DSL cubre los 12 tipos de regla sin lenguaje natural libre ni extensiones ad-hoc, y el _rule compiler_ produce términos que CP-SAT ingiere sin pérdida semántica (capítulo 4). Las instancias del _benchmark_ y el caso de estudio ejercitan la práctica totalidad del catálogo.
- **H2 (algorítmica) — validada con matices.** CP-SAT alcanza calidad muy superior a los baselines y resuelve a óptimo o casi-óptimo las instancias pequeñas/medianas en tiempos interactivos (< 30 s, típicamente decenas de ms). El matiz honesto: en la escala XL y en el objetivo Nash de la escala grande, no encuentra solución factible dentro del presupuesto — un techo de escalabilidad que acota el rango de "tamaño realista" para el que la hipótesis se sostiene sin reservas (hasta ~150 tareas / 20 personas con utilitario y max-min).

La validación, por tanto, no es una proclamación: es un contraste con datos que sostiene ambas hipótesis dentro de un rango caracterizado, y declara con precisión dónde el sistema deja de escalar. El capítulo 8 discute las implicaciones.
