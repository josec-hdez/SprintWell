"""Unit tests for the MAX_TASKS_PER_SPRINT compiler (issue #31).

Covers the dual behaviour: the hard mode imposes an absolute cap, the soft mode
penalises each task over the cap proportionally to the weight. To make the soft
penalty observable, tests add a per-task reward for assigning to the owner and
check whether the solver chooses to exceed the cap.

See:
- GitHub issue #31.
- Brief §6.3 (Forma C).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    MaxTasksPerSprintParams,
    ProblemInput,
    RuleMaxTasksPerSprint,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import BaseModelVars, build_base_model

_START = date(2026, 5, 4)


def _problem(*, n_tasks: int, duration_days: int = 5) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=duration_days),
        users=[User(id="u1", name="U1"), User(id="u2", name="U2")],
        tasks=[
            Task(
                id=f"t{i}",
                name=f"t{i}",
                effort_days=1,
                required_skills=[],
                category=TaskCategory.FEATURE,
                domain="d",
                depends_on=[],
            )
            for i in range(n_tasks)
        ],
    )


def _rule(*, max_tasks: int, is_hard: bool, weight: int = 0) -> RuleMaxTasksPerSprint:
    return RuleMaxTasksPerSprint(
        id="r_mts",
        owner_id="u1",
        is_hard=is_hard,
        weight=weight,
        params=MaxTasksPerSprintParams(max_tasks=max_tasks),
    )


def _owner_load(solver: cp_model.CpSolver, vars_: BaseModelVars, n_tasks: int) -> int:
    return sum(solver.value(vars_.assigned[(f"t{i}", "u1")]) for i in range(n_tasks))


def test_max_tasks_rule_is_registered() -> None:
    """Acceptance: MAX_TASKS_PER_SPRINT lives in the global registry."""
    assert RuleType.MAX_TASKS_PER_SPRINT in REGISTRY


def test_hard_mode_returns_no_objective_term() -> None:
    """Hard mode is a pure constraint ⇒ no objective term (None)."""
    problem = _problem(n_tasks=3)
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(max_tasks=1, is_hard=True), model, vars_) is None


def test_hard_mode_imposes_absolute_cap() -> None:
    """Even when every task assignment to the owner is rewarded, the hard cap holds."""
    n = 3
    problem = _problem(n_tasks=n)
    model, vars_ = build_base_model(problem)
    compile_rule(_rule(max_tasks=1, is_hard=True), model, vars_)

    # Pressure: reward putting tasks on the owner. The hard cap must still bind.
    model.maximize(sum(vars_.assigned[(f"t{i}", "u1")] for i in range(n)))
    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert _owner_load(solver, vars_, n) == 1


def test_soft_mode_returns_penalty_term() -> None:
    """Soft mode contributes an objective term (the excess penalty)."""
    problem = _problem(n_tasks=3)
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(max_tasks=1, is_hard=False, weight=50), model, vars_) is not None


def test_soft_penalty_outweighs_reward_keeps_within_cap() -> None:
    """A penalty heavier than the per-task reward keeps the owner within the cap."""
    n = 3
    problem = _problem(n_tasks=n)
    model, vars_ = build_base_model(problem)
    penalty = compile_rule(_rule(max_tasks=1, is_hard=False, weight=50), model, vars_)
    assert penalty is not None

    reward = 10 * sum(vars_.assigned[(f"t{i}", "u1")] for i in range(n))
    model.maximize(reward + penalty)  # +10 per task vs -50 per task over the cap
    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert _owner_load(solver, vars_, n) == 1  # exceeding never pays off


def test_soft_penalty_lighter_than_reward_allows_excess() -> None:
    """A penalty lighter than the reward lets the solver exceed the cap.

    Mirrors the previous test with a small weight, proving the penalty scales
    with the weight (proportional to each excess).
    """
    n = 3
    problem = _problem(n_tasks=n)
    model, vars_ = build_base_model(problem)
    penalty = compile_rule(_rule(max_tasks=1, is_hard=False, weight=5), model, vars_)
    assert penalty is not None

    reward = 10 * sum(vars_.assigned[(f"t{i}", "u1")] for i in range(n))
    model.maximize(reward + penalty)  # +10 per task vs -5 per task over the cap
    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert _owner_load(solver, vars_, n) == n  # reward wins: all tasks on the owner


def test_unreachable_cap_yields_no_term() -> None:
    """If the task count is already within the cap, the rule cannot bite (None)."""
    problem = _problem(n_tasks=2)
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(max_tasks=5, is_hard=True), model, vars_) is None
    assert compile_rule(_rule(max_tasks=5, is_hard=False, weight=50), model, vars_) is None


def test_soft_zero_weight_yields_no_term() -> None:
    """A soft rule with zero budget contributes no penalty."""
    problem = _problem(n_tasks=3)
    model, vars_ = build_base_model(problem)
    assert compile_rule(_rule(max_tasks=1, is_hard=False, weight=0), model, vars_) is None
