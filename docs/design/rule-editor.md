# Rule editor — design prototype (placeholder)

> **Placeholder for issue #76.** The real high-fidelity prototype belongs in
> Claude Design. Reference for the functional member rule editor (issue #77).

## Purpose

Let a member express their scheduling preferences as weighted soft rules (plus a
few hard ones), see how their fixed **weight budget** is split across rules, and
get warned about conflicting rules before saving (brief §6, §6.4).

## Proposed layout

```
My rules                                   Budget: 100 ── used 85 ▓▓▓▓▓▓▓▓░░
┌───────────────────────────────────────────────────────────────┐
│ Prefer category   [feature ▾]        weight [██████ 40 ]  (x)   │
│ Avoid weekday     [friday  ▾]        weight [███ 20 ]     (x)   │
│ Learn skill       [devops  ▾] min 2  weight [████ 25 ]   (x)   │
│ (!) Conflict: "prefer feature" vs "avoid feature"              │
└───────────────────────────────────────────────────────────────┘
        [ + Add rule ]                    [ Save ]  (disabled if over budget)
```

- A live **budget bar** shows total weight used vs the cap; going over disables
  Save and highlights the overflow.
- Each rule row: type selector, type-specific params, a weight slider/among the
  budget, and a remove control.
- **Conflict detection**: antagonistic pairs (e.g. prefer + avoid the same
  category) surface an inline warning on the affected rows.

## States

- **Within budget** — Save enabled.
- **Over budget** — Save disabled, budget bar in destructive color.
- **Conflicts present** — inline warnings; Save still allowed (soft) unless a
  hard-rule conflict, which blocks.
- **Saving / saved / error** — button state + toast.
