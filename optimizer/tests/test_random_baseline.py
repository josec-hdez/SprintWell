"""Tests for the random baseline solver (issue #38).

Verifies the baseline produces *structurally valid* schedules (R1, R2, R4, R5)
and is reachable via ``POST /solve?algorithm=random``.

See:
- GitHub issue #38.
- Brief §8.2 (random baseline), §7.2 (structural constraints).
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date

from fastapi.testclient import TestClient

from api import app
from models import Assignment, ProblemInput, RunStatus, Sprint, Task, TaskCategory, User
from solvers.random import solve_random

client = TestClient(app)
_START = date(2026, 5, 4)


def _task(
    id_: str,
    *,
    effort: int = 1,
    deadline: int | None = None,
    depends_on: list[str] | None = None,
) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=effort,
        required_skills=[],
        category=TaskCategory.FEATURE,
        domain="d",
        deadline_day=deadline,
        depends_on=depends_on or [],
    )


def _structural_problem() -> ProblemInput:
    """Three users, a dependency chain, a deadline, and a multi-day task."""
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=6),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2"), User(id="u3", name="U3")],
        tasks=[
            _task("t1", effort=2),
            _task("t2", depends_on=["t1"]),
            _task("t3", deadline=4),
            _task("t4"),
        ],
    )


def _assert_structurally_valid(problem: ProblemInput, assignments: list[Assignment]) -> None:
    """Check R1 (unique), R2 (no overlap), R4 (deadline), R5 (dependencies)."""
    tasks = {t.id: t for t in problem.tasks}
    by_task = {a.task_id: a for a in assignments}

    # R1: every task assigned exactly once.
    assert len(assignments) == len(problem.tasks)
    assert set(by_task) == set(tasks)

    # R2: per-user intervals do not overlap.
    intervals: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for a in assignments:
        intervals[a.user_id].append((a.start_day, a.start_day + tasks[a.task_id].effort_days))
    for spans in intervals.values():
        spans.sort()
        for (_, prev_end), (next_start, _) in zip(spans, spans[1:], strict=False):
            assert next_start >= prev_end

    # R3/R4: within horizon and respecting deadlines.
    for a in assignments:
        task = tasks[a.task_id]
        end = a.start_day + task.effort_days
        assert end <= problem.sprint.duration_days
        if task.deadline_day is not None:
            assert end <= task.deadline_day + 1

    # R5: each dependency ends before its successor starts.
    for task in problem.tasks:
        for dep in task.depends_on:
            assert by_task[dep].start_day + tasks[dep].effort_days <= by_task[task.id].start_day


def test_random_baseline_is_structurally_valid() -> None:
    """The direct random solver yields a valid R1/R2/R4/R5 schedule."""
    problem = _structural_problem()
    output = solve_random(problem, seed=42)

    assert output.status in (RunStatus.OPTIMAL, RunStatus.FEASIBLE)
    _assert_structurally_valid(problem, output.assignments)


def test_random_baseline_ignores_skill_filter() -> None:
    """R6 is disabled: a skill-less user may receive a skill-requiring task."""
    problem = ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=3),
        users=[User(id="u1", name="U1")],  # no skills at all
        tasks=[
            Task(
                id="t1",
                name="t1",
                effort_days=1,
                required_skills=["py"],  # u1 lacks it, but random ignores R6
                category=TaskCategory.FEATURE,
                domain="d",
                depends_on=[],
            )
        ],
    )
    output = solve_random(problem, seed=1)
    assert output.status in (RunStatus.OPTIMAL, RunStatus.FEASIBLE)
    assert output.assignments[0].user_id == "u1"


def test_solve_endpoint_random_algorithm() -> None:
    """POST /solve?algorithm=random returns a valid schedule."""
    problem = _structural_problem()
    response = client.post("/solve?algorithm=random", content=problem.model_dump_json())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in ("OPTIMAL", "FEASIBLE")
    assignments = [Assignment(**a) for a in body["assignments"]]
    _assert_structurally_valid(problem, assignments)


def test_solve_endpoint_rejects_unknown_algorithm() -> None:
    """An unsupported algorithm value is a 422 validation error."""
    problem = _structural_problem()
    response = client.post("/solve?algorithm=genetic", content=problem.model_dump_json())
    assert response.status_code == 422
