"""Unit tests for the PREFER_SKILL / AVOID_SKILL compilers (issue #26).

Each test builds a real CP-SAT base model, compiles the rule through the
registry (``compile_rule`` dispatches via the global REGISTRY, populated on
import), attaches the returned term as the objective, and checks the optimal
assignment reflects the preference. This exercises registration, dispatch and
the linear surrogate semantics end to end.

See:
- GitHub issue #26.
- Brief §6.3 (Forma A), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    AvoidSkillParams,
    PreferSkillParams,
    ProblemInput,
    RuleAvoidSkill,
    RulePreferSkill,
    RuleType,
    Skill,
    Sprint,
    Task,
    TaskCategory,
    User,
    UserSkill,
)
from rule_compiler import REGISTRY, compile_rule
from solvers.cpsat import build_base_model

_SKILL = "py"


def _problem(*, tasks: list[Task], duration_days: int = 5) -> ProblemInput:
    """Two users, both proficient in ``py`` so either is R6-eligible."""
    return ProblemInput(
        sprint=Sprint(
            id="s1",
            name="Sprint",
            start_date=date(2026, 5, 4),
            duration_days=duration_days,
        ),
        users=[
            User(id="u1", name="U1", skills=[UserSkill(skill_id=_SKILL, level=3)]),
            User(id="u2", name="U2", skills=[UserSkill(skill_id=_SKILL, level=3)]),
        ],
        tasks=tasks,
        skills=[Skill(id=_SKILL, name="Python")],
    )


def _task(id_: str, *, required_skills: list[str] | None = None) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=1,
        required_skills=required_skills or [],
        category=TaskCategory.FEATURE,
        domain="d",
        depends_on=[],
    )


def _prefer(weight: int = 10) -> RulePreferSkill:
    return RulePreferSkill(
        id="r_prefer",
        owner_id="u1",
        weight=weight,
        params=PreferSkillParams(skill_id=_SKILL),
    )


def _avoid(weight: int = 10) -> RuleAvoidSkill:
    return RuleAvoidSkill(
        id="r_avoid",
        owner_id="u1",
        weight=weight,
        params=AvoidSkillParams(skill_id=_SKILL),
    )


def test_both_skill_rules_are_registered() -> None:
    """Acceptance: PREFER_SKILL and AVOID_SKILL live in the global registry."""
    assert RuleType.PREFER_SKILL in REGISTRY
    assert RuleType.AVOID_SKILL in REGISTRY


def test_prefer_skill_pulls_matching_tasks_to_owner() -> None:
    """Maximising the PREFER term assigns the skill-matching task to the owner."""
    problem = _problem(tasks=[_task("t1", required_skills=[_SKILL])])
    model, vars_ = build_base_model(problem)

    term = compile_rule(_prefer(), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 1


def test_avoid_skill_pushes_matching_tasks_off_owner() -> None:
    """Maximising the AVOID term keeps the skill-matching task off the owner."""
    problem = _problem(tasks=[_task("t1", required_skills=[_SKILL])])
    model, vars_ = build_base_model(problem)

    term = compile_rule(_avoid(), model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u1")]) == 0
    assert solver.value(vars_.assigned[("t1", "u2")]) == 1


def test_prefer_compliance_grows_with_fraction_of_matching_tasks() -> None:
    """More matching tasks on the owner ⇒ a strictly larger PREFER term value.

    Two matching tasks both fit on one user within the horizon, so maximising
    pulls BOTH onto the owner: term = weight · 2 = 20, vs 10 for a single one.
    """
    problem = _problem(
        tasks=[
            _task("t1", required_skills=[_SKILL]),
            _task("t2", required_skills=[_SKILL]),
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
    assert solver.value(term) == 20  # weight(10) · 2 matching tasks


def test_no_matching_task_yields_no_term() -> None:
    """A skill no task requires produces no objective contribution (None)."""
    problem = _problem(tasks=[_task("t1", required_skills=[])])
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(), model, vars_) is None
    assert compile_rule(_avoid(), model, vars_) is None


def test_zero_weight_yields_no_term() -> None:
    """A zero-budget rule contributes nothing even with matching tasks."""
    problem = _problem(tasks=[_task("t1", required_skills=[_SKILL])])
    model, vars_ = build_base_model(problem)

    assert compile_rule(_prefer(weight=0), model, vars_) is None
    assert compile_rule(_avoid(weight=0), model, vars_) is None
