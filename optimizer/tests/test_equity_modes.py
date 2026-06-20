"""Tests for the three equity aggregation modes (issue #35).

The instance is built so the modes provably diverge (brief §7.4): two users
both prefer FEATURE work with different budgets (u1 weight 100, u2 weight 40)
competing for three FEATURE tasks. Utilitarian maximises the total and hands
all three to the higher-budget user; max-min lifts the worst-off; Nash sits
between the two on both metrics.

See:
- GitHub issue #35.
- Brief §7.3 (per-user happiness), §7.4 (equity modes), §7.5 (assembly).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    EquityMode,
    PreferCategoryParams,
    ProblemInput,
    RulePreferCategory,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import compile_by_owner
from rule_compiler.learn_skill import learning_skills_per_user
from solvers.cpsat import attach_equity_objective, build_base_model

_START = date(2026, 5, 4)


def _feature_task(id_: str) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=1,
        required_skills=[],
        category=TaskCategory.FEATURE,
        domain="d",
        depends_on=[],
    )


def _prefer_feature(owner: str, weight: int) -> RulePreferCategory:
    return RulePreferCategory(
        id=f"r_{owner}",
        owner_id=owner,
        weight=weight,
        params=PreferCategoryParams(category=TaskCategory.FEATURE),
    )


def _competition_problem() -> ProblemInput:
    """u1 (w=100) and u2 (w=40) both prefer the three FEATURE tasks."""
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=5),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=[_feature_task("t1"), _feature_task("t2"), _feature_task("t3")],
        rules=[_prefer_feature("u1", 100), _prefer_feature("u2", 40)],
    )


def _solve_happiness(problem: ProblemInput, mode: EquityMode) -> dict[str, int]:
    """Solve under ``mode`` and return each user's realised happiness surrogate."""
    relaxation = learning_skills_per_user(problem.rules)
    model, vars_ = build_base_model(problem, learning_skills_per_user=relaxation)
    per_user_terms = compile_by_owner(problem.rules, model, vars_)
    attach_equity_objective(model, vars_, per_user_terms, equity_mode=mode)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    return {
        owner: sum(solver.value(term) for term in terms) for owner, terms in per_user_terms.items()
    }


def test_three_modes_diverge_as_theory_predicts() -> None:
    """The same instance yields three different, theory-consistent allocations."""
    utilitarian = _solve_happiness(_competition_problem(), EquityMode.UTILITARIAN)
    max_min = _solve_happiness(_competition_problem(), EquityMode.MAX_MIN)
    nash = _solve_happiness(_competition_problem(), EquityMode.NASH)

    # Unique optima for this instance (3 FEATURE tasks split between the users):
    assert utilitarian == {"u1": 300, "u2": 0}  # all three to the high-budget user
    assert max_min == {"u1": 100, "u2": 80}  # lift the worst-off
    assert nash == {"u1": 200, "u2": 40}  # balanced compromise

    # Utilitarian maximises the total; max-min maximises the minimum; Nash is
    # strictly between on both metrics — the three modes differ consistently.
    assert sum(utilitarian.values()) > sum(nash.values()) > sum(max_min.values())
    assert min(max_min.values()) > min(nash.values()) > min(utilitarian.values())


def test_equity_mode_defaults_to_problem_setting() -> None:
    """Omitting ``equity_mode`` uses ``problem.equity_mode``."""
    problem = ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=5),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=[_feature_task("t1"), _feature_task("t2"), _feature_task("t3")],
        rules=[_prefer_feature("u1", 100), _prefer_feature("u2", 40)],
        equity_mode=EquityMode.MAX_MIN,
    )
    relaxation = learning_skills_per_user(problem.rules)
    model, vars_ = build_base_model(problem, learning_skills_per_user=relaxation)
    per_user_terms = compile_by_owner(problem.rules, model, vars_)
    attach_equity_objective(model, vars_, per_user_terms)  # no explicit mode

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    happiness = {
        owner: sum(solver.value(term) for term in terms) for owner, terms in per_user_terms.items()
    }
    assert happiness == {"u1": 100, "u2": 80}  # max-min allocation


def test_no_soft_rules_falls_back_to_feasible_objective() -> None:
    """With no soft terms the attacher falls back to the trivial objective."""
    problem = ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=5),
        users=[User(id="u1", name="U1")],
        tasks=[_feature_task("t1")],
    )
    model, vars_ = build_base_model(problem)
    attach_equity_objective(model, vars_, compile_by_owner(problem.rules, model, vars_))

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1
