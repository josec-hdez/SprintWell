"""Unit tests for the BLACKOUT_DATE compiler (issue #30).

BLACKOUT_DATE is a pure hard constraint: it adds constraints to the model and
returns no objective term. Tests build a real base model, compile the rule, and
solve for feasibility (no objective) to check the owner's tasks never overlap a
blackout day.

See:
- GitHub issue #30.
- Brief §6.3 (Forma B, BLACKOUT_DATE always hard).
"""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from ortools.sat.python import cp_model
from pydantic import ValidationError

from models import (
    BlackoutDateParams,
    ProblemInput,
    RuleBlackoutDate,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import build_base_model

_START = date(2026, 5, 4)


def _problem(*, users: list[User], tasks: list[Task], duration_days: int) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=duration_days),
        users=users,
        tasks=tasks,
    )


def _task(id_: str, *, effort: int = 1) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=effort,
        required_skills=[],
        category=TaskCategory.FEATURE,
        domain="d",
        depends_on=[],
    )


def _blackout(day_offsets: list[int], *, owner: str = "u1") -> RuleBlackoutDate:
    """Blackout rule for ``owner`` on the given sprint-day offsets (always hard)."""
    return RuleBlackoutDate(
        id="r_bo",
        owner_id=owner,
        is_hard=True,
        params=BlackoutDateParams(dates=[_START + timedelta(days=o) for o in day_offsets]),
    )


def test_blackout_rule_is_registered() -> None:
    """Acceptance: BLACKOUT_DATE lives in the global registry."""
    assert RuleType.BLACKOUT_DATE in REGISTRY


def test_blackout_compiles_to_constraint_not_objective_term() -> None:
    """Pure hard constraint ⇒ the compiler returns no objective term (None)."""
    problem = _problem(
        users=[User(id="u1", name="U1")],
        tasks=[_task("t1")],
        duration_days=5,
    )
    model, vars_ = build_base_model(problem)
    assert compile_rule(_blackout([1]), model, vars_) is None


def test_owner_cannot_take_task_that_must_overlap_blackout() -> None:
    """A 2-day task spanning the whole 2-day sprint always covers the blackout day,
    so the blacked-out owner cannot take it — it goes to the other user."""
    problem = _problem(
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=[_task("t1", effort=2)],
        duration_days=2,
    )
    model, vars_ = build_base_model(problem)
    compile_rule(_blackout([1]), model, vars_)  # blackout day index 1

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    assert solver.value(vars_.assigned[("t1", "u1")]) == 0
    assert solver.value(vars_.assigned[("t1", "u2")]) == 1


def test_owner_task_is_scheduled_around_the_blackout_day() -> None:
    """With the owner the only candidate, the task must avoid the blackout day."""
    problem = _problem(
        users=[User(id="u1", name="U1")],
        tasks=[_task("t1", effort=1)],
        duration_days=3,
    )
    model, vars_ = build_base_model(problem)
    compile_rule(_blackout([1]), model, vars_)  # blackout day index 1

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1
    assert solver.value(vars_.start["t1"]) != 1  # avoids the blackout day


def test_blackout_dates_outside_sprint_window_are_noop() -> None:
    """Blackout dates that fall outside the sprint add nothing (returns None)."""
    problem = _problem(
        users=[User(id="u1", name="U1")],
        tasks=[_task("t1")],
        duration_days=3,
    )
    model, vars_ = build_base_model(problem)
    assert compile_rule(_blackout([-1, 5]), model, vars_) is None  # before/after window


def test_blackout_cannot_be_marked_soft() -> None:
    """Acceptance: a BLACKOUT_DATE rule cannot be soft (guard lives in the model)."""
    with pytest.raises(ValidationError, match="is_hard"):
        RuleBlackoutDate(
            id="r_bo",
            owner_id="u1",
            is_hard=False,
            params=BlackoutDateParams(dates=[_START]),
        )
