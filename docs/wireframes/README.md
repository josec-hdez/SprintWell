# Wireframes — Text wireframes for Claude Design

Low-fidelity, plain-text wireframes for the five SprintWell product views. Each
file is a design INPUT for Claude Design: paste one file → it generates the React
prototype for exactly one story. Source of truth for all domain vocabulary is
`docs/sprintwell-brief.md` (§4.4, §5, §6, §7, §8, §10.1). Story H-0.1.2 / issue #2.

These are documents, not code — there is no runtime. They are meant to be
copy/paste-safe into a prompt, a PR review, a terminal, or a diff tool with zero
encoding risk.

## Story → file mapping

| Wireframe file           | View (brief §10.1)                          | Access    | Feeds story |
|--------------------------|---------------------------------------------|-----------|-------------|
| `public-sprint-view.md`  | Sprint detail + Gantt / calendar board      | anonymous | H-6.3.1     |
| `rule-editor.md`         | Preference-rule editor (budget + conflicts) | member    | H-7.3.1     |
| `wellbeing-dashboard.md` | Aggregated wellbeing dashboard              | anonymous | H-8.2.1     |
| `explainability.md`      | Per-assignment explainability panel         | anonymous | H-9.1.1     |
| `run-comparator.md`      | Two-PlanningRun comparator                  | anonymous | H-9.2.1     |

All five views are visible WITHOUT login (§4.4: Anónimo sees everything read-only).
Rule EDITING is the only member-gated action, so `rule-editor.md`'s profile is
`member` (with `admin` able to edit anyone's rules).

## Canonical skeleton (the contract every wireframe instantiates)

Every wireframe file uses these seven sections, in this order — nothing added,
nothing reordered:

````markdown
# <View Name> — <Access profile: anonymous | member | admin>

> Wireframe for Claude Design. Source of truth: docs/sprintwell-brief.md.
> Feeds story: <H-x.y.z>.

## Purpose

<1-2 lines: what the view is for. Maps to brief §10.1 bullet: "<exact §10.1 bullet>".>

## Domain entities in play

<Bulleted list of domain terms used, VERBATIM from the brief, each with its §ref:>
- `Sprint` (start_date, duration_days) — §5.2, §5.3
- `Task` (effort_days, status in {TODO, IN_PROGRESS, DONE, BLOCKED}, start_day) — §5.2
- `Assignment` — §5.1
- ...

## ASCII Layout

```
<plain-ASCII box layout, <= ~80 cols wide, fenced as a code block>
```

## Behavior notes

<Interactions: what is clickable, what opens what, cross-links to other wireframe
files, live behaviors (e.g. budget rebalance), tooltips, selectors.>

## State matrix

| State | Trigger | What the UI shows |
|-------|---------|-------------------|
| <state> | <what causes it> | <what is rendered> |

## Downstream story

Feeds **<H-x.y.z>** — <one line on what that prototype story builds from this file>.
````

Notes:
- "Purpose" quotes the exact §10.1 bullet so the view → story mapping is verifiable.
- "Domain entities in play" is where vocabulary is pinned with §refs.

## ASCII Layout convention (rules for every diagram)

1. Always inside a fenced code block (triple backticks). Never inline.
2. Plain ASCII only. Allowed character vocabulary:
   - Borders / frames: `+`, `-`, `|`, `=`
   - Buttons / actions: `[ Save ]`, `[ + Add rule ]`
   - Inputs / selectors: `[__________]`, dropdowns `[ option v ]`
   - Radio: `( )` unselected, `(o)` selected; checkbox / toggle: `[ ]` off, `[x]` on
   - Bars / progress (happiness, budget): `#` filled, `.` empty,
     e.g. `[#####.....] 50/100`
   - Tabs / columns separated by `|`
3. Maximum width ~80 columns. Keep boxes narrow enough to survive PR review and
   prompt paste.
4. Annotate, don't decorate: use inline `<-- like this` callouts sparingly to
   explain a region.
5. NO Unicode box-drawing glyphs (no `┌─┐│`), NO emoji, NO color names baked into
   the art (color is described in Behavior notes as "colored by task `status`",
   not drawn).
6. One layout per file is the norm; if a view has a clearly distinct sub-surface
   (e.g. the rule-editor's add-rule modal), show it as a second labeled ASCII
   block in the SAME "ASCII Layout" section.

## State-matrix format

Identical table in all five files:

```
| State | Trigger | What the UI shows |
|-------|---------|-------------------|
```

Per-file required states (rows the matrix MUST contain):

| File                      | loading | empty | error | INFEASIBLE | TIMEOUT | conflict | budget≠100 |
|---------------------------|:-------:|:-----:|:-----:|:----------:|:-------:|:--------:|:----------:|
| `public-sprint-view.md`   |   yes   |  yes  |  yes  |     —      |    —    |    —     |     —      |
| `rule-editor.md`          |   yes   |  yes  |  yes  |     —      |    —    |   yes    |    yes     |
| `wellbeing-dashboard.md`  |   yes   |  yes  |  yes  |    yes     |   +     |    —     |     —      |
| `explainability.md`       |   yes   |  yes  |  yes  |     —      |    —    |    —     |     —      |
| `run-comparator.md`       |   yes   |  yes  |  yes  |    yes     |   yes   |    —     |     —      |

(`yes` = required by the spec; `—` = not required; `+` = additive, not required by
the contract but present — `wellbeing-dashboard.md` also handles a per-run TIMEOUT
because it is `PlanningRun`-backed.)

State semantics (grounded in the brief):
- **loading**: data / solver fetch in flight — skeleton / spinner placeholders.
- **empty**: no data for the view (no sprints, no rules, no `PlanningRun`, or — for
  the comparator — fewer than two runs).
- **error**: fetch / save failed — show a retry affordance.
- **INFEASIBLE** (§8.1, H-8.1.1): the run returned no valid assignment → the view
  cannot render happiness / assignments; show a clear "no feasible plan" message.
- **TIMEOUT** (§8.1): solver hit its time limit; a run may carry `status = TIMEOUT`.
- **conflict** (§6.4, rule-editor only): conflicts detected before save → conflicts
  banner shown, save BLOCKED (covers all four §6.4 categories).
- **budget≠100** (§6.2, rule-editor only): over- or under-budget; the 100-point bar
  shows the current sum. `is_hard = true` rules do NOT consume budget.

## Vocabulary fidelity (anti-drift rule)

To stop the prototypes from drifting away from the domain model, every file pins
each term VERBATIM from the brief with its §ref, and quotes statuses / modes /
identifiers exactly:

- Task `status` ∈ {`TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`} (§5.2)
- Run `status` ∈ {`OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `TIMEOUT`} (§8.1)
- Individual happiness `f_j ∈ [0,1]`, fulfilment `c` fractional (§7.3)
- Equity modes: utilitarian (sum) / max-min (Rawlsian) / Nash (product) (§7.4)
- Algorithms: CP-SAT / random / greedy (§8.1–§8.3)
- Budget "suma actual / 100" (§6.2); 10 rule types / 5 forms (§6.3); 4 conflict
  categories (§6.4); `rule_evaluations`
  `[{rule_id, satisfied: bool|float, contribution: float}]` (§8.1)

No new fields. If a layout seems to need a field the brief doesn't define, that is
a drift signal — use a brief term or flag it as an open question instead of
inventing one.
