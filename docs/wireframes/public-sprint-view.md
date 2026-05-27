# Public Sprint View — Access profile: anonymous (Anónimo)

> Wireframe for Claude Design. Source of truth: docs/sprintwell-brief.md.
> Feeds story: H-6.3.1.

## Purpose

Read-only, no-login view of a single sprint: its detail, task list, assignments,
and a Gantt/weekly-calendar board showing each person's tasks day by day with
their current `status`. Maps to brief §10.1 (public) bullets: "Vista detalle de
un sprint con sus tareas y asignaciones." and "Tablero tipo Gantt o calendario
semanal mostrando, por persona, las tareas asignadas día a día y su `status`
actual."

## Domain entities in play

- `Sprint` (`start_date`, `duration_days` — typically 10 working days; day 0 =
  `start_date`) — §5.2, §5.3
- `Task` (`effort_days` integer >= 1, `start_day`, `category`, `domain`,
  `required_skills`, optional `deadline_day`, optional `dependencies`,
  `status` in {`TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`}) — §5.2, §17
- `Assignment` — triple `(task_id, user_id, start_day)`; a task occupies the user
  for `effort_days` consecutive days from `start_day` — §5.1, §5.2
- `User` (team member; persons are the rows of the board) — §5.1
- Access profile `Anónimo` — read-only over sprints, tasks, assignments — §4.4

## ASCII Layout

```
+----------------------------------------------------------------------------+
| SprintWell                                          [ anonymous - read only]|
+----------------------------------------------------------------------------+
| Sprint: [ Sprint 14 (active)        v ]   <-- selector: past/active/upcoming|
| start_date: 2026-06-01   duration_days: 10   (day 0 = start_date)           |
+----------------------------------------------------------------------------+
| TASK LIST                                                                   |
| id    title              cat      effort_days  start_day  status            |
| T-01  Login endpoint      feature      2           0       DONE             |
| T-02  Rate limiter        infra        3           2       IN_PROGRESS      |
| T-03  Pager rotation      on_call      1           1       BLOCKED          |
| T-04  Docs pass           docs         2           5       TODO             |
+----------------------------------------------------------------------------+
| GANTT / WEEKLY CALENDAR BOARD     rows = persons, cols = days (0..9)        |
|                                                                            |
|            D0   D1   D2   D3   D4   D5   D6   D7   D8   D9                  |
|  Ana     [T01][T01][   ][   ][   ][T04][T04][   ][   ][   ]                 |
|  Bruno   [   ][T03][T02][T02][T02][   ][   ][   ][   ][   ]                 |
|  Carla   [   ][   ][   ][   ][   ][   ][   ][   ][   ][   ]                 |
|                                                                            |
|  cell = a task occupies effort_days consecutive days from start_day        |
|  cell color/mark keyed by task status (see Behavior notes):                |
|    TODO . IN_PROGRESS / DONE = BLOCKED x                                    |
|  e.g.  [T02=] in-progress   [T01==] done   [T03x] blocked   [T04.] todo    |
+----------------------------------------------------------------------------+
| (hover a cell -> tooltip)   (click a cell/assignment -> explainability)     |
+----------------------------------------------------------------------------+
```

## Behavior notes

- Sprint selector at the top covers past, active, and upcoming sprints (brief
  §10.1: "Lista de sprints (pasados, activo, próximos)"). Changing it reloads the
  detail, task list, and board for the chosen `Sprint`.
- Board layout: rows are persons (`User`), columns are the sprint days
  `0 .. duration_days - 1`. An `Assignment` paints the cells for its task across
  `effort_days` consecutive days starting at `start_day`.
- Each cell is colored/marked by the task's current `status` in {`TODO`,
  `IN_PROGRESS`, `DONE`, `BLOCKED`}. Color is described here, not drawn in the
  ASCII art (per ASCII convention): TODO = neutral/grey, IN_PROGRESS = active/
  blue, DONE = green, BLOCKED = red.
- Per-cell tooltip on hover summarizes the task (title, `category`, `effort_days`,
  `status`, assigned `User`).
- Clicking a cell/assignment opens the per-assignment explainability view
  (cross-link to `explainability.md`) — shows which of the assigned user's rules
  are satisfied/violated and each one's contribution.
- Anonymous read-only: NO login, NO editing. Changing a task `status` is a member
  action and is NOT available here (brief §4.4).

## State matrix

| State   | Trigger                                   | What the UI shows                                         |
|---------|-------------------------------------------|-----------------------------------------------------------|
| loading | Sprint/board data fetch in flight         | Skeleton rows for the task list and board; spinner.       |
| empty   | No sprints exist, or selected sprint not yet planned (no assignments) | "No sprints to show" / "This sprint has no assignments yet"; selector still usable. |
| error   | Fetch of sprint/tasks/assignments failed  | Error message with a [ Retry ] affordance; no stale board.|

## Downstream story

Feeds **H-6.3.1** — the public sprint view prototype builds its read-only sprint
detail, task list, assignments, and Gantt/weekly-calendar board (with status-keyed
cells and the explainability cross-link) directly from this wireframe.
