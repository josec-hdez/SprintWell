"""Tests for the greedy skill-match baseline solver (issue #39).

Verifies structural validity (R1, R2, R4, R5), that selection follows
skill-match, that preference rules are ignored, and reachability via
``POST /solve?algorithm=greedy``.

See:
- GitHub issue #39.
- Brief §8.3 (greedy baseline).
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date

from fastapi.testclient import TestClient

from api import app
from models import (
    Assignment,
    PreferCategoryParams,
    ProblemInput,
    RulePreferCategory,
    RunStatus,
    Skill,
    Sprint,
    Task,
    TaskCategory,
    User,
    UserSkill,
)
from solvers.greedy import solve_greedy

client = TestClient(app)
_START = date(2026, 5, 4)


def _task(
    id_: str,
    *,
    effort: int = 1,
    deadline: int | None = None,
    depends_on: list[str] | None = None,
    skills: list[str] | None = None,
) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=effort,
        required_skills=skills or [],
        category=TaskCategory.FEATURE,
        domain="d",
        deadline_day=deadline,
        depends_on=depends_on or [],
    )


def _assert_structurally_valid(problem: ProblemInput, assignments: list[Assignment]) -> None:
    tasks = {t.id: t for t in problem.tasks}
    by_task = {a.task_id: a for a in assignments}

    assert len(assignments) == len(problem.tasks)
    assert set(by_task) == set(tasks)

    intervals: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for a in assignments:
        intervals[a.user_id].append((a.start_day, a.start_day + tasks[a.task_id].effort_days))
    for spans in intervals.values():
        spans.sort()
        for (_, prev_end), (next_start, _) in zip(spans, spans[1:], strict=False):
            assert next_start >= prev_end

    for a in assignments:
        task = tasks[a.task_id]
        end = a.start_day + task.effort_days
        assert end <= problem.sprint.duration_days
        if task.deadline_day is not None:
            assert end <= task.deadline_day + 1

    for task in problem.tasks:
        for dep in task.depends_on:
            assert by_task[dep].start_day + tasks[dep].effort_days <= by_task[task.id].start_day


def test_greedy_is_structurally_valid() -> None:
    """A dependency chain, a deadline and a multi-day task yield a valid schedule."""
    problem = ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=6),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=[
            _task("t1", effort=2),
            _task("t2", depends_on=["t1"]),
            _task("t3", deadline=4),
            _task("t4"),
        ],
    )
    output = solve_greedy(problem)
    assert output.status == RunStatus.FEASIBLE
    _assert_structurally_valid(problem, output.assignments)


def test_greedy_assigns_by_skill_match() -> None:
    """The task requiring a skill goes to the user who holds it."""
    problem = ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=3),
        users=[
            User(id="u1", name="U1"),  # no skills
            User(id="u2", name="U2", skills=[UserSkill(skill_id="py", level=4)]),
        ],
        tasks=[_task("t1", skills=["py"])],
        skills=[Skill(id="py", name="Python")],
    )
    output = solve_greedy(problem)
    assert output.assignments[0].task_id == "t1"
    assert output.assignments[0].user_id == "u2"  # best skill-match


def test_greedy_ignores_preference_rules() -> None:
    """With no skill signal, greedy ignores a strong preference and uses tie-break."""
    problem = ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=3),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=[_task("t1")],  # no required skills → skill-match tie
        rules=[
            RulePreferCategory(
                id="r1",
                owner_id="u2",
                weight=100,
                params=PreferCategoryParams(category=TaskCategory.FEATURE),
            )
        ],
    )
    output = solve_greedy(problem)
    # u2 strongly prefers this FEATURE task, but greedy is preference-blind and
    # breaks the skill-match tie by user id → u1.
    assert output.assignments[0].user_id == "u1"


def test_solve_endpoint_greedy_algorithm() -> None:
    """POST /solve?algorithm=greedy returns a valid schedule."""
    problem = ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=4),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=[_task("t1"), _task("t2", depends_on=["t1"])],
    )
    response = client.post("/solve?algorithm=greedy", content=problem.model_dump_json())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "FEASIBLE"
    assignments = [Assignment(**a) for a in body["assignments"]]
    _assert_structurally_valid(problem, assignments)
