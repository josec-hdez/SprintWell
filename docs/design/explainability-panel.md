# Explainability panel — design prototype (placeholder)

> **Placeholder for issue #84.** The real high-fidelity prototype belongs in
> Claude Design. Reference for the functional panel (issue #85).

## Purpose

For a given assignment (or member), explain *why* the plan looks the way it does
by listing each of that member's rules and whether the schedule satisfied it
(from `rule_evaluations`), so the outcome is defensible (brief §8, §13.2).

## Proposed layout

```
Why this plan? — Diego
┌───────────────────────────────────────────────────────────────┐
│ ✓ Prefer category "infra"        weight 50   satisfied         │
│ ✗ Blackout 2026-05-12 (hard)     —            respected        │
│ ~ Cooldown after on-call         weight 30   partially (0.5)   │
└───────────────────────────────────────────────────────────────┘
Happiness f_j: 0.67  =  Σ(wᵣ·cᵣ) / Σwᵣ
```

- One row per rule: satisfied (✓) / not (✗) / partial (~), with the weight and
  the contribution fraction `c_r`.
- Footer shows how the rows roll up into the member's `f_j`.
- Opened from a task/assignment in the Gantt (#81) or the dashboard (#82).

## States

- **Loading / error** — standard.
- **No rules** — "This member has no rules." with f_j = 1 by convention.
- **Loaded** — rule rows + f_j breakdown.
