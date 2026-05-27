# Bitácora metodológica de desarrollo asistido por IA

> Registro por sesión del uso de herramientas de IA durante el desarrollo de SprintWell. Es **contribución académica** (brief §12, capítulo 6 de la memoria), no anécdota: alimenta la estadística agregada y el análisis cualitativo de §12.3.
> Existe desde el commit 1 deliberadamente para mitigar el riesgo de §15 ("Bitácora metodológica que se queda en anécdota"): si se reconstruye a posteriori pierde validez.

## Cómo rellenar

Una fila por **sesión de trabajo** (cadencia: una entrada por sesión, no por commit). Rellénala al cierre de cada sesión. Columnas, en orden:

1. **fecha** — fecha de la sesión, formato ISO `YYYY-MM-DD`.
2. **duración (min)** — duración de la sesión en **minutos** (entero; p. ej. `45`).
3. **issue** — ID del issue de GitHub abordado (p. ej. `#5`).
4. **herramienta IA** — herramienta(s) de IA usadas en la sesión (p. ej. `Claude Code`). Puede haber más de una.
5. **tipo de uso** — uno o varios valores del vocabulario controlado (ver abajo).
6. **prompt resumen** — resumen breve del prompt o de la estrategia de prompting, no la transcripción completa.
7. **% aprovechado** — estimación subjetiva, entero `0–100`, del porcentaje de output de IA conservado tras la revisión (p. ej. `85`).
8. **defectos posteriores** — defectos descubiertos **más tarde** atribuibles al código generado por IA. Se rellena de forma **retroactiva**: vacío o `—` significa "ninguno conocido por ahora", **no** "ninguno jamás". La revisión semanal (viernes) y la Definition of Done por issue (§16) son el proceso que actualiza esta columna.
9. **observación** — nota cualitativa breve.

### Vocabulario controlado de `tipo de uso`

Valores permitidos (exactamente estos 6, según brief §12.2; usa los términos verbatim para que la estadística agregada de §12.3 sea limpia):

- `generación de código nuevo`
- `refactor`
- `debugging`
- `diseño`
- `redacción`
- `revisión`

> La fila marcada `[EJEMPLO]` es una plantilla de referencia y **debe excluirse** de cualquier estadística agregada de §12.3.

## Entradas

| fecha | duración (min) | issue | herramienta IA | tipo de uso | prompt resumen | % aprovechado | defectos posteriores | observación |
|---|---|---|---|---|---|---|---|---|
| 2026-05-27 `[EJEMPLO]` | 45 | #5 | Claude Code | redacción | Crear la bitácora metodológica desde brief §12.2: cabecera, semántica de columnas y fila de ejemplo | 90 | — | Fila plantilla, excluir de §12.3 |
