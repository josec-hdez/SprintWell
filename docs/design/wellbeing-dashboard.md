# Wellbeing dashboard — design prototype (placeholder)

> **Placeholder for issue #80.** The real high-fidelity prototype belongs in
> Claude Design. Reference for the functional dashboard (issue #82).

## Purpose

After a planning run, show how fairly the plan treats the team: per-member
happiness and the global equity metrics (brief §7, §13.2).

## Proposed layout

```
Sprint 14 — wellbeing              Equity mode: Nash   [ Compare runs ]
┌── Global ─────────────────────────────────────────────────────┐
│ Mean 0.87   Min 0.60   Max 1.00   Rules satisfied 87%          │
└────────────────────────────────────────────────────────────────┘

Per-member happiness (f_j)
Ana   ▓▓▓▓▓▓▓▓▓▓ 1.00
Hugo  ▓▓▓▓▓▓▓▓▓▓ 1.00
Diego ▓▓▓▓▓▓░░░░ 0.67
Beto  ▓▓▓▓▓▓░░░░ 0.60
…                                 (sorted ascending → worst-off first)
```

- Top strip: global mean / min / max happiness + % soft rules satisfied.
- Horizontal happiness bars per member, sorted worst-off first so inequity is
  obvious at a glance; color-graded (low = warm, high = cool).
- Link to the PlanningRun comparator (#87/#88).

## States

- **No run yet** — empty state prompting to plan the sprint.
- **Loading / error** — standard.
- **Loaded** — global strip + per-member bars.
