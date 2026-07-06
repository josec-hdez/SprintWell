# Capítulo 6 — Metodología de desarrollo asistido por IA

Este capítulo documenta, con métricas reales y no anecdóticas, el proceso por el que una sola persona construyó SprintWell asistida por un agente de IA, dentro del plazo de un TFM. Es el aporte metodológico (§1.3.3) y el capítulo con el que se contrasta la hipótesis H3. No es una apología de la IA ni un tutorial de _prompting_: es una bitácora crítica de qué se delegó, qué se revisó, qué se rechazó y qué se corrigió, y de por qué el proceso no degeneró en _vibe coding_ no auditable.

## 6.1 El protocolo: delegar, revisar, rechazar

El desarrollo no fue "pedir código y pegarlo". Se estructuró sobre un protocolo explícito, materializado en _skills_ reutilizables (procedimientos versionados) que el agente sigue de forma estricta:

- **Delegar** la implementación mecánica: escribir un caso de uso a partir de un patrón establecido, un controlador que sigue la convención de la capa, un componente React con su test. El humano dirige (qué construir, con qué arquitectura); la IA ejecuta (cómo, respetando las convenciones del repositorio).
- **Revisar** cada cambio antes de integrarlo: toda unidad de trabajo pasa por un _Pull Request_ con descripción en prosa, ejecución de la _quality gate_ (lint, _typecheck_, tests, _drift-checks_) y CI en verde. Nada se mezcla a `main` sin esa verificación.
- **Rechazar o corregir** cuando la evidencia contradice la sugerencia. La disciplina rectora —"verificar antes de afirmar"— obliga a comprobar contra el código y los datos en lugar de aceptar por defecto. La §6.4 recoge los casos concretos en que esta disciplina evitó integrar trabajo roto.

Reglas duras del protocolo (no negociables): _commits_ atómicos en inglés con formato _Conventional Commits_; **ningún _commit_ sin autorización explícita**; ningún cambio sin issue asociado; mensajes de _commit_ sin atribución a IA; y la _quality gate_ como condición de mezcla, no como sugerencia.

## 6.2 Métricas del proceso

La bitácora es auditable en el historial de Git del repositorio. Al cierre del trabajo:

- **85 _Pull Requests_ mezclados** a `main`, uno por unidad de trabajo (issue), cada uno con su CI en verde.
- **419 _commits_**, lo que da una media aproximada de **~5 _commits_ atómicos por PR**: la métrica del equipo premia la granularidad con intención, no el _commit_ monolítico.
- **Cobertura de tests por capa**: el optimizer con _pytest_ (unit + paridad de esquemas), el backend con Jest (unit + e2e DB-free), el frontend con Vitest (unit) y Playwright (e2e de los 5 flujos críticos). La _quality gate_ de cada servicio corre en CI en cada PR que toca sus rutas.
- **Trazabilidad completa**: cada PR cierra un issue (`Closes #N`); cada _commit_ pertenece a un PR revisado; el _spec_ OpenAPI y el cliente tipado se verifican regenerados en CI (_drift-check_ determinista), impidiendo divergencia silenciosa entre backend y frontend.

Estas cifras no miden "líneas por hora" —una métrica engañosa— sino **disciplina sostenida**: alta granularidad de _commits_, cobertura de test como puerta de mezcla y trazabilidad issue → PR → _commit_ → CI. Es exactamente lo que H3 exige poder documentar.

## 6.3 Dónde la IA acelera y dónde no

La aceleración fue real pero desigual. Donde el agente rindió más:

- **Trabajo repetitivo con patrón fijo**: una vez establecida la arquitectura DDD del backend o el patrón `hook + página + test` del frontend, replicar cada _feature_ nueva fue rápido y consistente.
- **Traducción entre capas**: derivar un DTO de respuesta desde una _view_, generar el cliente tipado desde el OpenAPI, escribir el test que refleja un caso de uso.
- **Cierre de detalle**: mensajes de error, estados de carga/vacío/error en la UI, _edge cases_ en los tests.

Donde la IA **no** sustituyó al juicio humano:

- **Decisiones de arquitectura y alcance**: qué capa, qué contrato, qué se difiere. La bifurcación de tipado del cliente (plugin de Swagger vs. DTOs por endpoint) fue una decisión dirigida por el humano.
- **Detección de trabajo roto _upstream_**: los huecos de la §6.4 se encontraron porque el proceso exige verificar contra datos reales, no por generación ciega.

## 6.4 Decisiones revertidas y huecos cerrados

La evidencia más fuerte de que hubo revisión —y no aceptación ciega— son los defectos _upstream_ detectados y corregidos durante la integración, no anunciados por los issues:

1. **Instancias del benchmark 100 % infactibles.** Al ejecutar el _benchmark_, las 12 instancias fijas resultaban `INFEASIBLE`: el generador asignaba _skills_ y _deadlines_ sin garantía de factibilidad. Se corrigió el generador (cobertura de skills desde un usuario real, redundancia de portadores, deadlines holgados) y se regeneraron; sin esta corrección, el capítulo 7 no tendría datos que comparar.
2. **Endpoint de login inexistente.** El `LoginUseCase` existía en la capa de aplicación pero nunca se había expuesto por HTTP. Se descubrió al construir el _store_ de auth del frontend y se cerró con su controlador y tests.
3. **Listado "mis tareas" inexistente.** Análogo: la vista de miembro requería un `GET /me/tasks` que no existía; se añadió el caso de uso, el endpoint y su e2e.
4. **Divergencia de agregación de equidad.** El caso de estudio reveló que `max-min` no elevaba el piso _normalizado_ como se esperaba, porque el objetivo agrega términos absolutos (Observación 3.1). En lugar de ocultarlo, se documentó en el modelo formal (cap. 3), los resultados (cap. 7) y las limitaciones (cap. 8).
5. **Error de proceso capturado.** En una ocasión se _commiteó_ sobre `main` por olvidar crear la rama; el error se detectó de inmediato (el _push_ falló) y se corrigió reubicando los _commits_ en una rama y restaurando `main`. Se registra aquí porque una bitácora honesta incluye los fallos de proceso, no solo los aciertos.

Cada uno de estos casos es una decisión de **no** integrar lo aparente y **sí** corregir la causa raíz — la antítesis del _vibe coding_.

## 6.5 Gestión de contexto y memoria

Un desarrollo largo asistido por IA choca con el límite de contexto del agente. Se mitigó con dos mecanismos: (1) una **memoria persistente** (engram) donde se registran decisiones, defectos y convenciones, recuperable entre sesiones; y (2) resúmenes de estado al alcanzar hitos, de modo que el hilo sobrevive a compactaciones de contexto sin perder las decisiones tomadas. Esta gestión explícita del contexto es parte del método: sin ella, un sistema de esta escala excede lo que cabe en una sola conversación.

## 6.6 Contraste de H3

H3 sostiene que un proceso asistido por IA permite a una sola persona construir un sistema de esta complejidad en el plazo de un TFM, con métricas documentables. La evidencia de este capítulo la respalda: un sistema end-to-end de tres servicios, con cobertura de test por capa y CI en verde, entregado con 85 PRs trazables y 419 _commits_ atómicos, y con los defectos _upstream_ detectados y corregidos en lugar de arrastrados. La hipótesis se matiza, no se proclama sin reservas: la aceleración depende de una **disciplina de verificación** que el humano debe imponer; sin ella, la misma herramienta produciría _vibe coding_. El valor metodológico del TFM no es "la IA puede", sino "la IA puede **si** se la somete a revisión, tests y trazabilidad" — y este capítulo documenta el _si_.
