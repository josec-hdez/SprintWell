# Wellbeing Dashboard — Access profile: anonymous (Anónimo)

> Wireframe for Claude Design. Source of truth: docs/sprintwell-brief.md.
> Feeds story: H-8.2.1.

## Purpose

Read-only, no-login dashboard aggregating the wellbeing of a single sprint's
`PlanningRun`: a happiness bar per person for `f_j ∈ [0,1]` plus the global
metrics (mean / min / max happiness and the percentage of soft rules satisfied),
labeled by which run and which equity mode produced the numbers. Maps to brief
§10.1 (public) bullet: "Dashboard de bienestar agregado del sprint: barras de
felicidad por persona, métricas globales (media, min, max)."

## Domain entities in play

- `f_j ∈ [0,1]` — individual happiness of user `j`; weighted mean of soft-rule
  fulfilments `c ∈ [0,1]` over their soft-rule weights; `c` is fractional in
  general — §7.3
- Equity mode (aggregation selector chosen when the run was launched):
  utilitarian (sum `F = Σ f_j`), max-min (Rawlsian `F = min_j f_j`), Nash
  (product, `F = Σ log(f_j + ε)`) — §7.4
- Global comparison metrics: mean / min / max happiness AND percentage of soft
  rules satisfied — §8.4
- `PlanningRun` — a concrete solver execution over a sprint, with its algorithm,
  parameters, result and metrics; carries `per_user_happiness` (`{user_id: f_j}`)
  and a `status` ∈ {`OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `TIMEOUT`} — §5.1, §8.1
- `Sprint` (`start_date`, `duration_days`) — §5.2, §5.3
- Access profile `Anónimo` — read-only over dashboards de bienestar agregado — §4.4

## ASCII Layout

```
+----------------------------------------------------------------------------+
| Wellbeing Dashboard                                 [ anonymous - read only]|
+----------------------------------------------------------------------------+
| Sprint: [ Sprint 14 (active)   v ]   Run: [ PlanningRun #cp-sat-02   v ]    |
| algorithm: CP-SAT   equity mode: max-min (Rawlsian)   status: OPTIMAL       |
+----------------------------------------------------------------------------+
| PER-PERSON HAPPINESS    f_j in [0,1]   (bar = f_j, 10 cells = 0.10 each)    |
|                                                                            |
|   Ana     [##########..........] 0.50                                      |
|   Bruno   [################....] 0.80                                      |
|   Carla   [######..............] 0.30   <-- min (least happy person)       |
|   Diego   [##################..] 0.90                                      |
|                                                                            |
|   bar key: # = filled, . = empty  (each cell = 0.10 of f_j)                |
+----------------------------------------------------------------------------+
| GLOBAL METRICS                                                              |
|   mean f_j .......... 0.625                                                 |
|   min  f_j .......... 0.30   (Carla)                                        |
|   max  f_j .......... 0.90   (Diego)                                        |
|   soft rules satisfied .......... 72%   (% of soft rules satisfied)         |
+----------------------------------------------------------------------------+
| (click a person's bar/assignment -> explainability for that assignment)     |
+----------------------------------------------------------------------------+
```

## Behavior notes

- The dashboard is always tied to ONE `PlanningRun` of ONE `Sprint`. The run
  selector lets the viewer pick which run's numbers to show; the header LABELS
  the chosen run, the algorithm that produced it (CP-SAT / random / greedy), the
  equity mode (utilitarian / max-min / Nash), and the run `status`.
- Per-person bars render `f_j ∈ [0,1]` (§7.3) — one bar per `User`, 10 ASCII
  cells where each cell = 0.10. The minimum bar is annotated since max-min mode
  optimizes precisely that person (§7.4).
- Global metrics block shows mean / min / max happiness and the percentage of
  soft rules satisfied (§8.4). These are the same metrics the benchmark compares
  across runs, so the numbers line up with `run-comparator.md`.
- Switching equity mode is NOT done here (launching a run is an admin action,
  §10.1); the dashboard only reflects the mode the selected run already used.
  To compare modes/algorithms side by side, cross-link to `run-comparator.md`.
- Clicking a person's bar / their assignment opens the per-assignment
  explainability view (cross-link to `explainability.md`) to see WHY that user's
  `f_j` is what it is (which rules satisfied/violated and each contribution).
- Anonymous read-only: NO login, NO editing.

## State matrix

| State      | Trigger                                                | What the UI shows                                                                              |
|------------|--------------------------------------------------------|------------------------------------------------------------------------------------------------|
| loading    | Run metrics / `per_user_happiness` fetch in flight     | Skeleton bars and greyed metric rows; spinner.                                                 |
| empty      | No `PlanningRun` exists for this sprint                | "This sprint has no planning run yet — no wellbeing data"; sprint selector still usable.       |
| error      | Fetch of run metrics failed                            | Error message with a [ Retry ] affordance; no stale bars.                                      |
| INFEASIBLE | Selected `PlanningRun` has `status = INFEASIBLE` (no valid assignment) | No bars/metrics rendered; clear "No feasible plan — happiness cannot be computed" message (per H-8.1.1); offer to pick another run. |
| TIMEOUT    | Selected `PlanningRun` has `status = TIMEOUT` (solver hit its time limit) | Render best-found metrics if any with a "Partial result — solver timed out" warning banner; otherwise treat like INFEASIBLE. |

## Downstream story

Feeds **H-8.2.1** — the wellbeing dashboard prototype builds its per-person
`f_j ∈ [0,1]` happiness bars, the global mean/min/max + % soft-rules-satisfied
metrics block, and the PlanningRun + equity-mode labeling (with INFEASIBLE/TIMEOUT
handling) directly from this wireframe.
