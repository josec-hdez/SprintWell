"""Acceptance tests for the CP-SAT base model builder (issue #18).

Three toy instances exercise R1-R5 (brief §7.2 / thesis §3.3) end to end:
- toy_1_simple: feasibility + assignment uniqueness (R1).
- toy_2_dependencies: precedence (R5) honored on the solved schedule.
- toy_3_deadlines: deadlines (R4) honored on the solved schedule.
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import ProblemInput, Sprint, Task, TaskCategory, User
from solvers import BaseModelVars, build_base_model


def _make_problem(
    *,
    users: list[str],
    tasks: list[Task],
    duration_days: int = 5,
) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(
            id="sprint_1",
            name="Sprint",
            start_date=date(2026, 5, 4),
            duration_days=duration_days,
        ),
        users=[User(id=u, name=u, skills=[]) for u in users],
        tasks=tasks,
    )


def _task(
    id_: str,
    *,
    effort: int = 1,
    depends_on: list[str] | None = None,
    deadline_day: int | None = None,
) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=effort,
        required_skills=[],
        category=TaskCategory.FEATURE,
        domain="d",
        depends_on=depends_on or [],
        deadline_day=deadline_day,
    )


def test_build_base_model_returns_correct_types() -> None:
    problem = _make_problem(users=["u_a"], tasks=[_task("t_1")])
    model, vars_ = build_base_model(problem)

    assert isinstance(vars_, BaseModelVars)
    assert vars_.problem is problem
    # All five variable maps populated with the expected cardinality.
    assert set(vars_.start.keys()) == {"t_1"}
    assert set(vars_.end.keys()) == {"t_1"}
    assert set(vars_.assigned.keys()) == {("t_1", "u_a")}
    assert set(vars_.interval.keys()) == {("t_1", "u_a")}
    # Model exposes the snake_case CpModel API used by the builder.
    assert hasattr(model, "add")
    assert hasattr(model, "add_no_overlap")


def test_toy_1_simple_feasible() -> None:
    problem = _make_problem(
        users=["u_a", "u_b"],
        tasks=[_task("t_1"), _task("t_2"), _task("t_3")],
    )
    model, vars_ = build_base_model(problem)
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    assert status in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    # R1: each task assigned to exactly one user.
    for task in problem.tasks:
        n_assigned = sum(solver.Value(vars_.assigned[task.id, user.id]) for user in problem.users)
        assert n_assigned == 1


def test_toy_2_dependencies_respected() -> None:
    problem = _make_problem(
        users=["u_a", "u_b"],
        tasks=[
            _task("t_1"),
            _task("t_2", depends_on=["t_1"]),
            _task("t_3", depends_on=["t_2"]),
        ],
    )
    model, vars_ = build_base_model(problem)
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    assert status in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    # R5: predecessor.end <= successor.start across the dependency chain.
    assert solver.Value(vars_.end["t_1"]) <= solver.Value(vars_.start["t_2"])
    assert solver.Value(vars_.end["t_2"]) <= solver.Value(vars_.start["t_3"])


def test_toy_3_deadlines_respected() -> None:
    problem = _make_problem(
        users=["u_a", "u_b"],
        tasks=[
            _task("t_a", effort=2, deadline_day=1),  # end <= deadline_day + 1 = 2
            _task("t_b", effort=2, deadline_day=3),  # end <= deadline_day + 1 = 4
        ],
    )
    model, vars_ = build_base_model(problem)
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    assert status in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    # R4: end[i] <= deadline_day(i) + 1.
    assert solver.Value(vars_.end["t_a"]) <= 2
    assert solver.Value(vars_.end["t_b"]) <= 4
