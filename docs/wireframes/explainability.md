# Per-Assignment Explainability — Access profile: anonymous (Anónimo)

> Wireframe for Claude Design. Source of truth: docs/sprintwell-brief.md.
> Feeds story: H-9.1.1.

## Purpose

Read-only side panel / modal, opened by clicking an assignment, that explains
WHY the assigned user got that task: which of their rules are satisfied, which
are violated, how much each one contributes, and how that rolls up into the
user's `f_j`. Maps to brief §10.1 (public) bullet: "Vista de explicabilidad por
asignación: al pinchar una tarea, mostrar qué reglas del asignado se satisfacen,
cuáles no, cuánto suma cada una."

## Domain entities in play

- `rule_evaluations` — per-run explainability base, shape
  `[{rule_id, satisfied: bool|float, contribution: float}]`; `satisfied` is
  FRACTIONAL in general (e.g. 0.8 = "80% of my tasks are Python") — §8.1, §7.3
- `f_j ∈ [0,1]` — the assigned user's individual happiness; weighted mean of
  soft-rule fulfilments `c` over weights `w`; this panel shows how each rule's
  contribution rolls up into `f_j` — §7.3
- Soft-rule penalty — a violated soft rule penalizes proportionally to its weight
  (cumplimiento `c` below 1), lowering its contribution — §7.5
- `Assignment` — triple `(task_id, user_id, start_day)`; the panel is anchored to
  one assignment — §5.1, §5.2
- `Rule` (`type`, `params`, `weight`, `is_hard`) — the rules being evaluated — §6.1
- Access profile `Anónimo` — read-only over explicabilidad de asignaciones — §4.4

## ASCII Layout

```
+----------------------- Explainability -----------------------+ [ x close ]
| Assignment: T-02 "Rate limiter"  ->  Bruno   start_day: 2    |
|             (opened from the Gantt cell in public-sprint-view)|
+--------------------------------------------------------------+
| Assigned user f_j: [################....] 0.80               |
|   (weighted mean of this user's soft-rule fulfilments)       |
+--------------------------------------------------------------+
| RULES SATISFIED                          satisfied  contrib  |
|   PREFER_CATEGORY: infra                    1.0      +0.30   |
|   PREFER_SKILL: rust                        0.8      +0.20   |
|     (0.8 = fractional: 80% of tasks match)                   |
+--------------------------------------------------------------+
| RULES VIOLATED                           satisfied  contrib  |
|   AVOID_WEEKDAY: saturday                   0.0      -0.10   |
|     (task overlaps a saturday -> soft penalty by weight)     |
|   MAX_TASKS_PER_SPRINT: 3                    0.5      -0.05   |
+--------------------------------------------------------------+
| how each contributes to f_j:  sum of (weight x cumplimiento) |
|   normalized over this user's soft-rule weights -> f_j = 0.80|
|   (hard rules are absolute constraints, not scored here)     |
+--------------------------------------------------------------+
```

## Behavior notes

- The panel/modal is OPENED by clicking an `Assignment` — specifically a cell in
  the Gantt board of `public-sprint-view.md` (cross-link back to
  `public-sprint-view.md`). Closing it returns to the board.
- It reads from the selected `PlanningRun`'s `rule_evaluations` (§8.1) FILTERED to
  the assigned user. Each row shows `rule_id` (rendered as type + params),
  `satisfied` (bool OR float — fractional in general, e.g. 0.8), and
  `contribution` (signed: satisfied rules add, violated soft rules subtract via
  the §7.5 penalty proportional to weight).
- The header bar shows the assigned user's `f_j ∈ [0,1]` (§7.3); the footer notes
  that `f_j` is the weight-normalized sum of `weight x cumplimiento` across the
  user's soft rules, so the listed contributions add up to it.
- Hard rules (`is_hard = true`) are absolute constraints, not scored into `f_j`,
  so they do not appear in the contribution math; only soft-rule
  satisfied/violated rows are listed (mirroring §7.3 / §7.5).
- Anonymous read-only: NO login, NO editing. Editing the rules themselves is the
  member action in `rule-editor.md`, not here.

## State matrix

| State   | Trigger                                                   | What the UI shows                                                                 |
|---------|-----------------------------------------------------------|-----------------------------------------------------------------------------------|
| loading | `rule_evaluations` for the clicked assignment in flight   | Skeleton rows for satisfied/violated lists; greyed `f_j` bar; spinner.            |
| empty   | The assignment's user declared no rules (no evaluations)  | "This user declared no preference rules — nothing to explain for this assignment"; `f_j` shown as neutral/undefined. |
| error   | Fetch of the assignment's `rule_evaluations` failed       | Error message with a [ Retry ] affordance; panel keeps the assignment header.     |

## Downstream story

Feeds **H-9.1.1** — the explainability panel prototype builds its satisfied /
violated rule lists, the per-rule `satisfied` (bool|float) and `contribution`
columns from `rule_evaluations`, and the roll-up into the assigned user's `f_j`
directly from this wireframe.
