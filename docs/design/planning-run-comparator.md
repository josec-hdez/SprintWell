# PlanningRun comparator — design prototype (placeholder)

> **Placeholder for issue #87.** The real high-fidelity prototype belongs in
> Claude Design. Reference for the functional comparator (issue #88).

## Purpose

Put two planning runs of the *same* sprint side by side so the user can see how
changing the algorithm or equity mode reshapes the plan and the wellbeing
metrics (brief §7.4, §13.2).

## Proposed layout

```
Compare — Sprint 14
        [ Run A: cpsat · nash ▾ ]        [ Run B: cpsat · max-min ▾ ]
┌── Metrics ────────────────────┬───────────────────────────────┐
│ Mean happiness   0.87         │ 0.71        (▼ lower)          │
│ Min happiness    0.60         │ 0.33        (▼ lower)          │
│ Rules satisfied  87%          │ 74%         (▼ lower)          │
│ Solve time       79 ms        │ 34 ms                          │
├── Per-member Δ ───────────────┴───────────────────────────────┤
│ Hugo   1.00 → 1.00   (=)                                       │
│ Diego  0.67 → 0.33   (▼)                                       │
│ …                                                              │
└────────────────────────────────────────────────────────────────┘
```

- Two run selectors (same sprint); default to the two most recent.
- Metrics table with A vs B and a delta indicator.
- Per-member happiness delta list, highlighting who improved/regressed.

## States

- **Fewer than two runs** — prompt to create another run.
- **Loading / error** — standard.
- **Loaded** — metric + per-member comparison.
