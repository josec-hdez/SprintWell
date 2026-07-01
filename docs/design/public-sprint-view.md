# Public sprint view — design prototype (placeholder)

> **Placeholder for issue #70.** The real high-fidelity prototype belongs in
> Claude Design. Reference for the functional listing (#71) and detail (#72),
> already implemented.

## Purpose

Let any visitor browse the team's sprints without logging in (brief §4.4). Two
views: the listing and the per-sprint detail.

## Proposed layout — listing

```
Sprints
┌──────────────────────────────────────────┐
│ Apollo — Sprint 14                         │
│ Starts 2026-05-04 · 15 days · 24 tasks     │  ← whole card is a link
├──────────────────────────────────────────┤
│ Apollo — Sprint 13 …                       │
└──────────────────────────────────────────┘
            [ Load more ]                        ← client-side paging
```

## Proposed layout — detail

```
← All sprints
Apollo — Sprint 14
Starts 2026-05-04 · 15 days · 24 tasks

┌ Task ────────── Category ─ Domain ─ Effort ─ Deadline ─ Status ┐
│ OAuth login API  feature    auth     3 days   Day 8     TODO    │
│ …                                                              │
└────────────────────────────────────────────────────────────────┘
```

## States

- **Loading** — "Loading sprints…" / "Loading sprint…".
- **Empty** — "No sprints yet." / "No tasks in this sprint.".
- **Error** — inline alert.
- **Loaded** — cards / metadata + task table.
