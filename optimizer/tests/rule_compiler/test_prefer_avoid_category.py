"""Unit tests for the PREFER_CATEGORY / AVOID_CATEGORY compilers (issue #27).

Each test builds a real CP-SAT base model, compiles the rule through the
registry (``compile_rule`` dispatches via the global REGISTRY, populated on
import), attaches the returned term as the objective, and checks the optimal
assignment reflects the preference.

See:
- GitHub issue #27.
- Brief §6.3 (Forma A), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    AvoidCategoryParams,
    PreferCategoryParams,
    ProblemInput,
    RuleAvoidCategory,
    RulePreferCategory,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import build_base_model


def _problem(*, tasks: list[Task], duration_days: int = 5) -> ProblemInput:
    """Two skill-less users — any user is eligible for any (skill-less) task."""
    return ProblemInput(
        sprint=Sprint(
            id="s1",
            name="Sprint",
            start_date=date(2026, 5, 4),
            duration_days=duration_days,
        ),
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


def _prefer(weight: int = 10, *, category: TaskCategory = TaskCategory.BUG) -> RulePreferCategory:
    return RulePreferCategory(
        id="r_prefer",
        owner_id="u1",
        weight=weight,
        params=PreferCategoryParams(category=category),
    )


def _avoid(weight: int = 10, *, category: TaskCategory = TaskCategory.BUG) -> RuleAvoidCategory:
    return RuleAvoidCategory(
        id="r_avoid",
        owner_id="u1",
        weight=weight,
        params=AvoidCategoryParams(category=category),
    )


def test_both_category_rules_are_registered() -> None:
    """Acceptance: PREFER_CATEGORY and AVOID_CATEGORY live in the registry."""
    assert RuleType.PREFER_CATEGORY in REGISTRY
    assert RuleType.AVOID_CATEGORY in REGISTRY


def test_prefer_category_pulls_matching_tasks_to_owner() -> None:
    """Maximising the PREFER term assigns the category-matching task to the owner."""
    problem = _problem(tasks=[_task("t1", category=TaskCategory.BUG)])
    model, vars_ = build_base_model(problem)

    term = compile_rule(_prefer(), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1


def test_avoid_category_pushes_matching_tasks_off_owner() -> None:
    """Maximising the AVOID term keeps the category-matching task off the owner."""
    problem = _problem(tasks=[_task("t1", category=TaskCategory.BUG)])
    model, vars_ = build_base_model(problem)

    term = compile_rule(_avoid(), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 0
    assert solver.value(vars_.assigned[("t1", "u2")]) == 1


def test_prefer_compliance_reflects_fraction_of_matching_tasks() -> None:
    """Only category-matching tasks drive the term; off-category ones do not.

    Two BUG tasks and one FEATURE task: maximising the PREFER(BUG) term pulls
    both BUG tasks onto the owner (term = weight · 2 = 20) and is indifferent to
    the FEATURE task, which never contributes.
    """
    problem = _problem(
        tasks=[
            _task("t1", category=TaskCategory.BUG),
            _task("t2", category=TaskCategory.BUG),
            _task("t3", category=TaskCategory.FEATURE),
        ]
    )
    model, vars_ = build_base_model(problem)

    term = compile_rule(_prefer(weight=10, category=TaskCategory.BUG), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1
    assert solver.value(vars_.assigned[("t2", "u1")]) == 1
    assert solver.value(term) == 20  # weight(10) · 2 BUG tasks; FEATURE ignored


def test_no_matching_task_yields_no_term() -> None:
    """A category no task belongs to produces no objective contribution (None)."""
    problem = _problem(tasks=[_task("t1", category=TaskCategory.FEATURE)])
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(category=TaskCategory.BUG), model, vars_) is None
    assert compile_rule(_avoid(category=TaskCategory.BUG), model, vars_) is None


def test_zero_weight_yields_no_term() -> None:
    """A zero-budget rule contributes nothing even with matching tasks."""
    problem = _problem(tasks=[_task("t1", category=TaskCategory.BUG)])
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(weight=0), model, vars_) is None
    assert compile_rule(_avoid(weight=0), model, vars_) is None
