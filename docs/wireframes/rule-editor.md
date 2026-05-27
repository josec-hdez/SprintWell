# Preference Rule Editor — Access profile: member (Miembro); admin can edit anyone's

> Wireframe for Claude Design. Source of truth: docs/sprintwell-brief.md.
> Feeds story: H-7.3.1.

## Purpose

Authenticated editor where a member manages their own preference `Rule`s: create,
edit, delete, enable/disable, distribute the 100-point budget across active rules,
toggle hard/soft, and resolve conflicts detected before save. Maps to brief §10.1
(member) bullets: "Editor de sus propias reglas de preferencia (crear, editar,
eliminar, habilitar/deshabilitar).", "Indicador visual del reparto de presupuesto
sobre sus reglas (suma actual / 100).", "Toggle hard/soft donde aplique.", and
"Detector de conflictos antes de guardar."

## Domain entities in play

- `Rule` (common shape: `id`, `owner_id`, `type`, `params`, `weight`, `is_hard`,
  `enabled`, `schema_version`) — §6.1
- 100-point budget — each user distributes a fixed total of 100 points across
  their active rules (`suma actual / 100`); `is_hard = true` rules do NOT consume
  budget; optimizer normalizes on receipt but the UI nudges toward 100 — §6.2
- The 10 rule types across 5 semantic forms — §6.3:
  - Form A (task attribute): `PREFER_SKILL` / `AVOID_SKILL` (`{ skill_id }`);
    `PREFER_CATEGORY` / `AVOID_CATEGORY`
    (`{ category in feature|bug|infra|sre|on_call|docs|research }`);
    `PREFER_DOMAIN` (`{ domain }`)
  - Form B (temporal absolute): `PREFER_WEEKDAY` / `AVOID_WEEKDAY`
    (`{ weekday in monday..sunday }`); `BLACKOUT_DATE` (`{ dates: ISO[] }`,
    ALWAYS hard, does not consume budget, cannot be soft)
  - Form C (load/volume): `MAX_TASKS_PER_SPRINT` (`{ max: int }`);
    `FOCUS_PREFERENCE` (`{ }`)
  - Form D (sequence/relation): `COOLDOWN_AFTER`
    (`{ after_category: string, rest_days: int }`)
  - Form E (growth): `LEARN_SKILL` (`{ skill_id: string, min_tasks: int }`)
- The 4 conflict categories validated before save — §6.4:
  direct (same type, opposite params), weight-sum cannot reach 100, cross
  (e.g. PREFER_CATEGORY vs AVOID_CATEGORY same value), schema-invalid params
- Access profile `Miembro` edits OWN rules; `Admin` may edit anyone's — §4.4

## ASCII Layout

(a) MAIN EDITOR

```
+----------------------------------------------------------------------------+
| My Preference Rules            owner: Ana (member)   [admin: edit anyone v] |
+----------------------------------------------------------------------------+
| BUDGET (soft rules only)        suma actual / 100                          |
|   [##########################.............]  60 / 100   UNDER BUDGET (-40)  |
|   note: is_hard rules do NOT consume budget                                |
+----------------------------------------------------------------------------+
| RULES                                                                       |
| en  type               params                  hard?  weight (slider)      |
| [x] PREFER_CATEGORY     category: feature        [ ]   [#####.....] 25      |
| [x] AVOID_WEEKDAY       weekday: saturday        [ ]   [######....] 35      |
| [x] BLACKOUT_DATE       dates: [2026-06-05]      [x]*  (no budget) hard     |
| [ ] LEARN_SKILL         skill_id: rust, min: 2   [ ]   (disabled)          |
|   * BLACKOUT_DATE is always hard; cannot be toggled soft                   |
|                                              [ + Add rule ]  [ Delete sel ] |
+----------------------------------------------------------------------------+
| !! CONFLICTS (2) - resolve before saving --------------------------------- |
|  [direct]  PREFER_WEEKDAY: saturday  vs  AVOID_WEEKDAY: saturday           |
|  [budget]  weights of active soft rules cannot reach 100 (sum = 60)        |
+----------------------------------------------------------------------------+
|                                   [ Save ]  <-- BLOCKED while conflicts > 0 |
+----------------------------------------------------------------------------+
```

(b) ADD-RULE MODAL (type selector + dynamic fields per type)

```
+--------------------- Add rule -----------------------------------+
| Type: [ PREFER_CATEGORY                                       v ] |
|   (10 types / 5 forms)                                           |
|   Form A: PREFER_SKILL  AVOID_SKILL  PREFER_CATEGORY             |
|           AVOID_CATEGORY  PREFER_DOMAIN                          |
|   Form B: PREFER_WEEKDAY  AVOID_WEEKDAY  BLACKOUT_DATE           |
|   Form C: MAX_TASKS_PER_SPRINT  FOCUS_PREFERENCE                 |
|   Form D: COOLDOWN_AFTER                                         |
|   Form E: LEARN_SKILL                                           |
|------------------------------------------------------------------|
| Dynamic fields (change with Type):                               |
|   PREFER_SKILL / AVOID_SKILL  : skill_id [____________]          |
|   PREFER_CATEGORY/AVOID_CATEGORY: category [ feature         v ] |
|         ( feature|bug|infra|sre|on_call|docs|research )          |
|   PREFER_DOMAIN               : domain  [____________]           |
|   PREFER_WEEKDAY/AVOID_WEEKDAY: weekday [ saturday          v ]  |
|   BLACKOUT_DATE               : dates   [ 2026-06-05 ] [ + add ] |
|   MAX_TASKS_PER_SPRINT        : max     [ 4  ]                   |
|   FOCUS_PREFERENCE            : (no params)                      |
|   COOLDOWN_AFTER              : after_category [ on_call    v ]  |
|                                 rest_days      [ 1  ]            |
|   LEARN_SKILL                 : skill_id [____] min_tasks [ 2 ]  |
|------------------------------------------------------------------|
| hard/soft:  ( ) soft   ( ) hard     (forced hard for BLACKOUT_DATE)|
|                                       [ Cancel ]   [ Add rule ]  |
+------------------------------------------------------------------+
```

## Behavior notes

- BUDGET BAR rebalances LIVE as sliders move: dragging one rule's weight
  redistributes the remaining points across the other active SOFT rules so the
  user sees the trade-off in real time; the bar shows `suma actual / 100`.
- `is_hard = true` rules do NOT consume budget — they are absolute constraints
  (§6.2). `BLACKOUT_DATE` is ALWAYS hard, does not consume budget, and cannot be
  marked soft (§6.3). The hard/soft toggle applies to the other types where
  applicable.
- enable/disable per rule (`enabled`): a disabled rule keeps its definition but
  drops out of the active budget and is not sent to the optimizer.
- CONFLICTS BANNER is shown before save; the [ Save ] button is BLOCKED while any
  conflict exists (§6.4: "Detectar conflictos en el backend antes de enviar al
  optimizador. Devolver lista de conflictos al frontend para que el usuario los
  resuelva."). The banner covers all four §6.4 categories:
  1. direct — same type, opposite params (e.g. `PREFER_WEEKDAY: saturday` +
     `AVOID_WEEKDAY: saturday`)
  2. cross — e.g. `PREFER_CATEGORY: sre` + `AVOID_CATEGORY: sre`
  3. weight-sum-cannot-reach-100 — active soft-rule weights can't total 100
  4. schema-invalid — `params` invalid against the rule type's JSON Schema
- ADD-RULE MODAL: a type selector exposes all 10 rule types across the 5 forms;
  the field set changes dynamically with the chosen type (see layout b). The
  hard/soft toggle is shown where applicable and forced to hard for
  `BLACKOUT_DATE`.
- ACCESS: a member edits their OWN rules; an admin can switch owner and edit
  anyone's rules (e.g. to unblock or resolve conflicts) — §4.4.

## State matrix

| State      | Trigger                                                  | What the UI shows                                                                 |
|------------|----------------------------------------------------------|-----------------------------------------------------------------------------------|
| loading    | Rule set fetch in flight                                 | Skeleton rule rows; budget bar greyed; Save disabled.                             |
| empty      | Member has no rules yet                                  | "No rules yet" message with a prominent [ + Add rule ]; budget bar at 0/100.      |
| error      | Fetch or save failed                                     | Error message with [ Retry ]; entered edits preserved.                            |
| conflict   | One or more of the 4 §6.4 conflicts detected before save | Conflicts banner listing each conflict by category; [ Save ] BLOCKED.             |
| budget!=100| Active soft-rule weights sum over or under 100           | Budget bar shows current sum vs 100 with OVER/UNDER label; UI nudges toward 100 (optimizer would normalize, but UI guides to 100). |
| saved      | Save succeeds (no conflicts, valid params)               | Success confirmation; rule set persisted; banner cleared.                         |

## Downstream story

Feeds **H-7.3.1** — the rule editor prototype builds its 100-point budget bar with
live rebalance, the per-rule weight/hard-soft/enable controls, the add-rule modal
covering all 10 rule types across the 5 forms, and the conflicts banner (4 §6.4
categories, save blocked) directly from this wireframe.
