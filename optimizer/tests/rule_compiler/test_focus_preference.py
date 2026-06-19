"""Unit tests for the FOCUS_PREFERENCE compiler (issue #32).

The contribution must be inverse to the number of distinct categories the owner
works. Value-based tests force specific assignments and read the term; a
behavioural test fixes the owner's workload and checks the solver concentrates.

See:
- GitHub issue #32.
- Brief §6.3 (Forma C).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    FocusPreferenceParams,
    ProblemInput,
    RuleFocusPreference,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import build_base_model

_START = date(2026, 5, 4)


def _problem(*, tasks: list[Task], duration_days: int = 5) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=duration_days),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=tasks,
    )


def _task(id_: str, *, category: TaskCategory) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=1,
        required_skills=[],
        category=category,
        domain="d",
        depends_on=[],
    )


def _rule(weight: int = 10) -> RuleFocusPreference:
    return RuleFocusPreference(
        id="r_focus", owner_id="u1", weight=weight, params=FocusPreferenceParams()
    )


def test_focus_rule_is_registered() -> None:
    """Acceptance: FOCUS_PREFERENCE lives in the global registry."""
    assert RuleType.FOCUS_PREFERENCE in REGISTRY


def test_single_category_for_owner_has_zero_penalty() -> None:
    """Owner working one category ⇒ focused ⇒ no penalty (term = 0)."""
    problem = _problem(
        tasks=[
            _task("t0", category=TaskCategory.FEATURE),
            _task("t1", category=TaskCategory.FEATURE),
            _task("t2", category=TaskCategory.BUG),
        ]
    )
    model, vars_ = build_base_model(problem)
    term = compile_rule(_rule(weight=10), model, vars_)
    assert term is not None

    # Owner takes the two FEATURE tasks; the BUG task goes elsewhere.
    model.add(vars_.assigned[("t0", "u1")] == 1)
    model.add(vars_.assigned[("t1", "u1")] == 1)
    model.add(vars_.assigned[("t2", "u1")] == 0)

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    assert solver.value(term) == 0  # distinct = 1 → max(0, 1-1) = 0


def test_penalty_grows_with_distinct_categories() -> None:
    """Owner spanning two categories ⇒ one excess category ⇒ term = -weight."""
    problem = _problem(
        tasks=[
            _task("t0", category=TaskCategory.FEATURE),
            _task("t1", category=TaskCategory.BUG),
        ]
    )
    model, vars_ = build_base_model(problem)
    term = compile_rule(_rule(weight=10), model, vars_)
    assert term is not None

    model.add(vars_.assigned[("t0", "u1")] == 1)  # FEATURE
    model.add(vars_.assigned[("t1", "u1")] == 1)  # BUG → 2 distinct categories

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    assert solver.value(term) == -10  # distinct = 2 → max(0, 2-1) = 1 → -weight·1


def test_focus_concentrates_owner_under_fixed_workload() -> None:
    """Maximising the term concentrates the owner's fixed workload into one category."""
    problem = _problem(
        tasks=[
            _task("t0", category=TaskCategory.FEATURE),
            _task("t1", category=TaskCategory.FEATURE),
            _task("t2", category=TaskCategory.BUG),
            _task("t3", category=TaskCategory.BUG),
        ]
    )
    model, vars_ = build_base_model(problem)
    term = compile_rule(_rule(weight=10), model, vars_)
    assert term is not None

    # Force the owner to take exactly two tasks, then let focus pick which.
    owner_load = sum(vars_.assigned[(f"t{i}", "u1")] for i in range(4))
    model.add(owner_load == 2)
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(term) == 0  # two tasks of the SAME category → no penalty


def test_at_most_one_category_in_pool_yields_no_term() -> None:
    """If the pool has ≤ 1 category, the owner can never spread (None)."""
    problem = _problem(
        tasks=[
            _task("t0", category=TaskCategory.FEATURE),
            _task("t1", category=TaskCategory.FEATURE),
        ]
    )
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(weight=10), model, vars_) is None


def test_zero_weight_yields_no_term() -> None:
    """A zero-budget rule contributes nothing."""
    problem = _problem(
        tasks=[
            _task("t0", category=TaskCategory.FEATURE),
            _task("t1", category=TaskCategory.BUG),
        ]
    )
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(weight=0), model, vars_) is None
