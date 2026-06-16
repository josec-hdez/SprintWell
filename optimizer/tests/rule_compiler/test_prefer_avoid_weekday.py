"""Unit tests for the PREFER_WEEKDAY / AVOID_WEEKDAY compilers (issue #29).

Weekday→sprint-day mapping is computed here with ``datetime`` so the tests stay
correct regardless of which calendar weekday ``start_date`` happens to be.

See:
- GitHub issue #29.
- Brief §6.3 (Forma B), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from datetime import date, timedelta

from ortools.sat.python import cp_model

from models import (
    AvoidWeekdayParams,
    PreferWeekdayParams,
    ProblemInput,
    RuleAvoidWeekday,
    RulePreferWeekday,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
    Weekday,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import build_base_model

_START = date(2026, 5, 4)
_ISO_TO_WEEKDAY = {
    0: Weekday.MONDAY,
    1: Weekday.TUESDAY,
    2: Weekday.WEDNESDAY,
    3: Weekday.THURSDAY,
    4: Weekday.FRIDAY,
    5: Weekday.SATURDAY,
    6: Weekday.SUNDAY,
}


def _day_indices(start: date, duration: int, weekday: Weekday) -> list[int]:
    """Sprint day indices whose date falls on ``weekday`` (mirror of the compiler)."""
    iso = {wd: i for i, wd in _ISO_TO_WEEKDAY.items()}[weekday]
    return [d for d in range(duration) if (start + timedelta(days=d)).weekday() == iso]


def _problem(*, tasks: list[Task], duration_days: int) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=duration_days),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
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


def _prefer(weekday: Weekday, *, weight: int = 10) -> RulePreferWeekday:
    return RulePreferWeekday(
        id="r_prefer", owner_id="u1", weight=weight, params=PreferWeekdayParams(weekday=weekday)
    )


def _avoid(weekday: Weekday, *, weight: int = 10) -> RuleAvoidWeekday:
    return RuleAvoidWeekday(
        id="r_avoid", owner_id="u1", weight=weight, params=AvoidWeekdayParams(weekday=weekday)
    )


def test_both_weekday_rules_are_registered() -> None:
    """Acceptance: PREFER_WEEKDAY and AVOID_WEEKDAY live in the registry."""
    assert RuleType.PREFER_WEEKDAY in REGISTRY
    assert RuleType.AVOID_WEEKDAY in REGISTRY


def test_prefer_weekday_schedules_task_on_that_weekday() -> None:
    """Maximising PREFER pins a 1-day task onto the preferred weekday, on the owner."""
    duration = 7
    (saturday,) = _day_indices(_START, duration, Weekday.SATURDAY)
    problem = _problem(tasks=[_task("t1")], duration_days=duration)
    model, vars_ = build_base_model(problem)

    term = compile_rule(_prefer(Weekday.SATURDAY), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1
    assert solver.value(vars_.start["t1"]) == saturday


def test_avoid_weekday_keeps_task_off_that_weekday() -> None:
    """Maximising AVOID assigns the task to the owner but off the avoided weekday."""
    duration = 7
    (saturday,) = _day_indices(_START, duration, Weekday.SATURDAY)
    problem = _problem(tasks=[_task("t1")], duration_days=duration)
    model, vars_ = build_base_model(problem)

    term = compile_rule(_avoid(Weekday.SATURDAY), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1
    assert solver.value(vars_.start["t1"]) != saturday


def test_prefer_weekday_considers_multiday_overlap() -> None:
    """A 2-day task must be scheduled so its interval *overlaps* the weekday.

    Exercises the acceptance criterion: compliance accounts for every day the
    task spans, not just its start day.
    """
    duration = 7
    (saturday,) = _day_indices(_START, duration, Weekday.SATURDAY)
    problem = _problem(tasks=[_task("t1", effort=2)], duration_days=duration)
    model, vars_ = build_base_model(problem)

    term = compile_rule(_prefer(Weekday.SATURDAY), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1
    start = solver.value(vars_.start["t1"])
    assert start <= saturday <= start + 1  # the 2-day interval covers Saturday


def test_weekday_absent_from_sprint_yields_no_term() -> None:
    """A weekday no sprint day falls on produces no objective contribution."""
    duration = 1  # only the start_date's weekday is present
    present_iso = _START.weekday()
    absent = _ISO_TO_WEEKDAY[(present_iso + 3) % 7]
    assert _day_indices(_START, duration, absent) == []  # guard: truly absent

    problem = _problem(tasks=[_task("t1")], duration_days=duration)
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(absent), model, vars_) is None
    assert compile_rule(_avoid(absent), model, vars_) is None


def test_zero_weight_yields_no_term() -> None:
    """A zero-budget rule contributes nothing even when the weekday is present."""
    problem = _problem(tasks=[_task("t1")], duration_days=7)
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(Weekday.SATURDAY, weight=0), model, vars_) is None
    assert compile_rule(_avoid(Weekday.SATURDAY, weight=0), model, vars_) is None
