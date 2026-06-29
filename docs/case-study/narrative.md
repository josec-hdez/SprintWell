# Sprint 14 de Apollo — narrativa

> Acompaña a [`team.md`](./team.md) (el equipo) y a [`results.md`](./results.md)
> (los resultados). Todo es sintético (brief §3).

## El escenario

Es lunes 4 de mayo de 2026. El equipo Apollo arranca su Sprint 14, de tres
semanas. La product owner llega con 24 ítems de backlog que cruzan varias áreas
del producto:

- **Autenticación** — nueva API de login OAuth (con deadline para una demo el
  día 8), su pantalla web, el flujo móvil, una auditoría de seguridad y los
  arreglos del pen-test.
- **Billing** — API de cobros y su dashboard, más un bug urgente de doble cobro
  (deadline día 5).
- **Pagos** — webhook de pagos y un job de reconciliación.
- **Datos** — pipeline ETL, dashboard de analítica y un spike de ranking con ML.
- **Infra / SRE** — migración a Kubernetes, acelerar CI, rotación de secretos,
  ajuste de alertas y un runbook de guardia.
- **Calidad** — suite de regresión y un harness de pruebas E2E.
- **Diseño y docs** — design system v2, pulido de UI móvil, referencia de API y
  guía de onboarding.

El detalle completo —esfuerzo en días, skills requeridos, dependencias y
deadlines— vive en la instancia
[`benchmarks/instances/case-study.json`](../../benchmarks/instances/case-study.json).
Hay dependencias naturales: la pantalla de login depende de su API, el dashboard
de analítica depende del pipeline de datos, los arreglos del pen-test dependen de
la auditoría.

## El problema que resuelve SprintWell

Hasta ahora, el tech lead repartía el backlog a mano en una reunión de dos horas.
El resultado tenía tres problemas crónicos:

1. **Injusticia silenciosa.** Alguien siempre terminaba con todo el trabajo que
   nadie quería (documentación, guardias), sprint tras sprint, sin que nadie lo
   midiera.
2. **Preferencias ignoradas.** Las preferencias ("prefiero trabajar en datos",
   "no me asignen despliegues los viernes") se olvidaban bajo la presión de la
   reunión.
3. **No escalaba.** Con 24 tareas, 10 personas, skills, dependencias y deadlines,
   nadie puede explorar mentalmente el espacio de asignaciones.

SprintWell modela el sprint como un problema de optimización (brief §7): asigna
cada tarea a una persona y a un día de inicio, respetando skills, dependencias,
capacidad y reglas duras, mientras **maximiza la felicidad agregada** según un
modo de equidad elegido.

## Cómo se usa

El equipo resuelve la misma instancia bajo cada modo de equidad con el solver
exacto (CP-SAT), vía la CLI del optimizer:

```bash
# Desde optimizer/ — modo utilitario (suma total de felicidad)
uv run sprintwell-solve solve -i ../benchmarks/instances/case-study.json \
  -o - --algorithm cpsat --equity-mode utilitarian --time-budget 20

# max-min (levanta al peor servido) y nash (producto, balance)
uv run sprintwell-solve solve -i ../benchmarks/instances/case-study.json \
  -o - --algorithm cpsat --equity-mode max-min --time-budget 20
uv run sprintwell-solve solve -i ../benchmarks/instances/case-study.json \
  -o - --algorithm cpsat --equity-mode nash --time-budget 20
```

Para tener una referencia, también se corre con los baselines `random` y
`greedy` (brief §13.1). Los nueve resultados (3 algoritmos × 3 modos) y su
lectura cualitativa están en [`results.md`](./results.md).

## La pregunta del caso

> ¿El plan que produce SprintWell es **mejor** que repartir a mano, y **en qué se
> traduce** elegir un modo de equidad sobre otro para personas concretas como
> Hugo (el junior) o Diego (de guardia)?
