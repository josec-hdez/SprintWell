"""Unit tests for the COOLDOWN_AFTER compiler (issue #33).

Covers the dual behaviour: hard mode forbids a new task from starting within
``rest_days`` of a trigger-category task finishing; soft mode penalises each such
violation. The canonical ``on_call`` + 1 rule is used throughout.

See:
- GitHub issue #33.
- Brief §6.3 (Forma D).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    CooldownAfterParams,
    ProblemInput,
    RuleCooldownAfter,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import build_base_model

_START = date(2026, 5, 4)


def _problem(*, tasks: list[Task], n_users: int = 1, duration_days: int = 4) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=duration_days),
        users=[User(id=f"u{i + 1}", name=f"U{i + 1}") for i in range(n_users)],
        tasks=tasks,
    )


def _task(
    id_: str,
    *,
    category: TaskCategory = TaskCategory.FEATURE,
    effort: int = 1,
    depends_on: list[str] | None = None,
) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=effort,
        required_skills=[],
        category=category,
        domain="d",
        depends_on=depends_on or [],
    )


def _rule(*, is_hard: bool, rest_days: int = 1, weight: int = 0) -> RuleCooldownAfter:
    return RuleCooldownAfter(
        id="r_cd",
        owner_id="u1",
        is_hard=is_hard,
        weight=weight,
        params=CooldownAfterParams(after_category=TaskCategory.ON_CALL, rest_days=rest_days),
    )


def test_cooldown_rule_is_registered() -> None:
    """Acceptance: COOLDOWN_AFTER lives in the global registry."""
    assert RuleType.COOLDOWN_AFTER in REGISTRY


def test_hard_mode_returns_no_objective_term() -> None:
    """Hard mode is a pure constraint ⇒ no objective term (None)."""
    problem = _problem(tasks=[_task("a", category=TaskCategory.ON_CALL), _task("b")])
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(is_hard=True), model, vars_) is None


def test_hard_mode_enforces_rest_gap_after_trigger() -> None:
    """A dependent task must start at least rest_days after the on-call task ends."""
    rest_days = 1
    # b depends on a ⇒ a precedes b (R5); cooldown must add the extra rest gap.
    problem = _problem(
        tasks=[
            _task("a", category=TaskCategory.ON_CALL),
            _task("b", depends_on=["a"]),
        ],
        duration_days=4,
    )
    model, vars_ = build_base_model(problem)
    compile_rule(_rule(is_hard=True, rest_days=rest_days), model, vars_)

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    end_a = solver.value(vars_.end["a"])
    start_b = solver.value(vars_.start["b"])
    assert start_b >= end_a + rest_days  # the cooldown gap is respected


def test_soft_mode_returns_penalty_term() -> None:
    """Soft mode contributes an objective term (the violation penalty)."""
    problem = _problem(tasks=[_task("a", category=TaskCategory.ON_CALL), _task("b")])
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(is_hard=False, weight=20), model, vars_) is not None


def test_soft_mode_penalises_a_violating_schedule() -> None:
    """Forcing B to start right when A ends (rest_days=1) scores one violation."""
    problem = _problem(
        tasks=[_task("a", category=TaskCategory.ON_CALL), _task("b")],
        duration_days=4,
    )
    model, vars_ = build_base_model(problem)
    term = compile_rule(_rule(is_hard=False, rest_days=1, weight=20), model, vars_)
    assert term is not None

    model.add(vars_.start["a"] == 0)  # a occupies day 0, end = 1
    model.add(vars_.start["b"] == 1)  # b starts on day 1 ∈ cooldown window [1, 1]

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    assert solver.value(term) == -20  # one violation · weight


def test_soft_mode_no_penalty_when_gap_respected() -> None:
    """Forcing B past the cooldown window scores no violation (term = 0)."""
    problem = _problem(
        tasks=[_task("a", category=TaskCategory.ON_CALL), _task("b")],
        duration_days=4,
    )
    model, vars_ = build_base_model(problem)
    term = compile_rule(_rule(is_hard=False, rest_days=1, weight=20), model, vars_)
    assert term is not None

    model.add(vars_.start["a"] == 0)  # end = 1
    model.add(vars_.start["b"] == 2)  # starts past the cooldown window

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    assert solver.value(term) == 0


def test_zero_rest_days_yields_no_term() -> None:
    """rest_days == 0 means an empty cooldown window (None)."""
    problem = _problem(tasks=[_task("a", category=TaskCategory.ON_CALL), _task("b")])
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(is_hard=True, rest_days=0), model, vars_) is None
    assert compile_rule(_rule(is_hard=False, rest_days=0, weight=20), model, vars_) is None


def test_no_trigger_category_task_yields_no_term() -> None:
    """No task of the after_category ⇒ nothing to cool down after (None)."""
    problem = _problem(tasks=[_task("a"), _task("b")])  # both FEATURE, none ON_CALL
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(is_hard=True), model, vars_) is None
    assert compile_rule(_rule(is_hard=False, weight=20), model, vars_) is None


def test_soft_zero_weight_yields_no_term() -> None:
    """A soft rule with zero budget contributes no penalty."""
    problem = _problem(tasks=[_task("a", category=TaskCategory.ON_CALL), _task("b")])
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(is_hard=False, weight=0), model, vars_) is None
