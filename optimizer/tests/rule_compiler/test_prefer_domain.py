"""Unit tests for the PREFER_DOMAIN compiler (issue #28).

Each test builds a real CP-SAT base model, compiles the rule through the
registry (``compile_rule`` dispatches via the global REGISTRY, populated on
import), attaches the returned term as the objective, and checks the optimal
assignment reflects the preference.

See:
- GitHub issue #28.
- Brief §6.3 (Forma A), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    PreferDomainParams,
    ProblemInput,
    RulePreferDomain,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import build_base_model

_DOMAIN = "auth"


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


def _task(id_: str, *, domain: str) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=1,
        required_skills=[],
        category=TaskCategory.FEATURE,
        domain=domain,
        depends_on=[],
    )


def _prefer(weight: int = 10, *, domain: str = _DOMAIN) -> RulePreferDomain:
    return RulePreferDomain(
        id="r_prefer",
        owner_id="u1",
        weight=weight,
        params=PreferDomainParams(domain=domain),
    )


def test_prefer_domain_rule_is_registered() -> None:
    """Acceptance: PREFER_DOMAIN lives in the global registry."""
    assert RuleType.PREFER_DOMAIN in REGISTRY


def test_prefer_domain_pulls_matching_tasks_to_owner() -> None:
    """Maximising the PREFER term assigns the domain-matching task to the owner."""
    problem = _problem(tasks=[_task("t1", domain=_DOMAIN)])
    model, vars_ = build_base_model(problem)

    term = compile_rule(_prefer(), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1


def test_prefer_compliance_grows_with_fraction_in_domain() -> None:
    """Only domain-matching tasks drive the term; off-domain ones do not.

    Two "auth" tasks and one "billing" task: maximising PREFER(auth) pulls both
    auth tasks onto the owner (term = weight · 2 = 20) and is indifferent to the
    billing task, which never contributes.
    """
    problem = _problem(
        tasks=[
            _task("t1", domain=_DOMAIN),
            _task("t2", domain=_DOMAIN),
            _task("t3", domain="billing"),
        ]
    )
    model, vars_ = build_base_model(problem)

    term = compile_rule(_prefer(weight=10), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1
    assert solver.value(vars_.assigned[("t2", "u1")]) == 1
    assert solver.value(term) == 20  # weight(10) · 2 auth tasks; billing ignored


def test_no_matching_task_yields_no_term() -> None:
    """A domain no task belongs to produces no objective contribution (None)."""
    problem = _problem(tasks=[_task("t1", domain="billing")])
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(domain=_DOMAIN), model, vars_) is None


def test_zero_weight_yields_no_term() -> None:
    """A zero-budget rule contributes nothing even with matching tasks."""
    problem = _problem(tasks=[_task("t1", domain=_DOMAIN)])
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(weight=0), model, vars_) is None
