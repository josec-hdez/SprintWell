# Run Comparator — Access profile: anonymous (Anónimo)

> Wireframe for Claude Design. Source of truth: docs/sprintwell-brief.md.
> Feeds story: H-9.2.1.

## Purpose

Read-only side-by-side comparison of TWO `PlanningRun`s of the SAME sprint: the
assignment diff (who got which task, `start_day` changes) and the global-metrics
diff, with each run labeled by its algorithm, equity mode, and `status`. Maps to
brief §10.1 (public) bullet: "Comparador de dos `PlanningRun` del mismo sprint."

## Domain entities in play

- `PlanningRun` — a concrete solver execution over a sprint, with its algorithm,
  parameters, result and metrics; a sprint can have several, "varias por sprint,
  comparables" — §5.1
- Run `status` ∈ {`OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `TIMEOUT`} — solver output
  status — §8.1
- `objective_value` (float) — value of the objective function under the run's
  equity mode — §8.1
- Comparison metrics: `objective_value`, mean / min / max happiness (`f_j`),
  percentage of soft rules satisfied, execution time — §8.4
- Algorithms: CP-SAT (main solver), random (baseline 1), greedy by skill-match
  (baseline 2) — §8.1, §8.2, §8.3
- Equity mode: utilitarian (sum) / max-min (Rawlsian) / Nash (product) — §7.4
- `Assignment` — triple `(task_id, user_id, start_day)`; the diff compares these
  across the two runs — §5.1, §5.2
- Access profile `Anónimo` — read-only over comparador de runs — §4.4

## ASCII Layout

```
+----------------------------------------------------------------------------+
| Run Comparator   Sprint: [ Sprint 14 (active)  v ]      [ anonymous - r/o ] |
+----------------------------------------------------------------------------+
|              RUN A                       |              RUN B               |
|  PlanningRun #cp-sat-02                  |  PlanningRun #greedy-01          |
|  algorithm: CP-SAT                       |  algorithm: greedy               |
|  equity mode: max-min                    |  equity mode: (n/a - blind)      |
|  status: OPTIMAL                         |  status: FEASIBLE                |
+------------------------------------------+----------------------------------+
| ASSIGNMENT DIFF  (task -> user @ start_day;  *= differs between runs)       |
|  T-01  Ana   @ D0                        |  T-01  Ana   @ D0                 |
| *T-02  Bruno @ D2                        | *T-02  Carla @ D1                 |
| *T-03  Carla @ D1                        | *T-03  Bruno @ D4                 |
|  T-04  Ana   @ D5                        |  T-04  Ana   @ D5                 |
+------------------------------------------+----------------------------------+
| GLOBAL METRICS DIFF                      |                                  |
|  objective_value ...... 3.10            |  objective_value ...... 2.40     |
|  mean f_j ............. 0.625    (A>B)  |  mean f_j ............. 0.55      |
|  min  f_j ............. 0.30     (A>B)  |  min  f_j ............. 0.20      |
|  max  f_j ............. 0.90            |  max  f_j ............. 0.95      |
|  soft rules satisfied . 72%      (A>B)  |  soft rules satisfied . 58%      |
|  exec time ............ 4.2 s           |  exec time ............ 0.1 s    |
+------------------------------------------+----------------------------------+
| (click any assignment in either column -> explainability for that run)      |
+----------------------------------------------------------------------------+
```

## Behavior notes

- Both columns are constrained to the SAME `Sprint`; two run selectors pick RUN A
  and RUN B from the `PlanningRun`s that exist for that sprint. Each column header
  LABELS its run with the algorithm (CP-SAT / random / greedy), the equity mode
  (utilitarian / max-min / Nash; baselines that ignore preferences show "n/a"),
  and the run `status` ∈ {OPTIMAL, FEASIBLE, INFEASIBLE, TIMEOUT}.
- ASSIGNMENT DIFF aligns rows by `task_id`; rows where the `user_id` or `start_day`
  differs between the two runs are marked (here with `*`) so the swap is obvious.
- GLOBAL METRICS DIFF compares `objective_value`, mean/min/max `f_j`, and the
  percentage of soft rules satisfied (§8.4), plus execution time; the better side
  of each metric is annotated (e.g. `A>B`). Note `objective_value` is only
  comparable when both runs use the SAME equity mode — flag a mismatch.
- Clicking any assignment in either column opens the per-assignment explainability
  view for THAT run (cross-link to `explainability.md`).
- Anonymous read-only: NO login, NO editing. Launching new runs is an admin
  action (§10.1) and is NOT available here.

## State matrix

| State      | Trigger                                                          | What the UI shows                                                                                  |
|------------|------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| loading    | Both runs' assignments/metrics fetch in flight                   | Skeleton rows in both columns; greyed metric blocks; spinner.                                      |
| empty      | Fewer than 2 `PlanningRun`s exist for this sprint                | "Need at least two planning runs to compare" with a prompt to run again (admin); single run shown read-only if one exists. |
| error      | Fetch of either run failed                                       | Error message with a [ Retry ]; the column that loaded stays, the failed column shows its own error. |
| INFEASIBLE | One or both runs have `status = INFEASIBLE` (no valid assignment)| The affected column shows "No feasible plan — nothing to compare on this side" (per H-8.1.1); the diff degrades gracefully to the side that has a solution. |
| TIMEOUT    | One or both runs have `status = TIMEOUT` (solver time limit hit) | The affected column shows a "Partial result — solver timed out" warning and compares best-found metrics where available. |

## Downstream story

Feeds **H-9.2.1** — the run-comparator prototype builds its two-column same-sprint
layout, the assignment diff (`user_id` / `start_day` changes), the global-metrics
diff (`objective_value`, mean/min/max `f_j`, % soft rules), and the per-run
algorithm / equity-mode / status labeling (with per-run INFEASIBLE/TIMEOUT and the
<2-runs empty case) directly from this wireframe.
