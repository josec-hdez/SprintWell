"""Unit tests for the LEARN_SKILL compiler (issue #34).

LEARN_SKILL has two seams: it relaxes R6 at build time (via the
``learning_skills_per_user`` map fed to ``build_base_model``) and it rewards
reaching ``min_tasks`` (via the registered compiler). Tests exercise both, plus
the map-extraction helper.

See:
- GitHub issue #34 (depends on #21's R6 hook).
- Brief §6.3 (Forma E), §7.2 R6.
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    LearnSkillParams,
    PreferSkillParams,
    ProblemInput,
    Rule,
    RuleLearnSkill,
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
from rule_compiler.learn_skill import learning_skills_per_user
from solvers.cpsat import build_base_model

_START = date(2026, 5, 4)
_SKILL = "py"


def _problem(*, users: list[User], tasks: list[Task], duration_days: int = 5) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(id="s1", name="Sprint", start_date=_START, duration_days=duration_days),
        users=users,
        tasks=tasks,
        skills=[Skill(id=_SKILL, name="Python")],
    )


def _py_task(id_: str) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=1,
        required_skills=[_SKILL],
        category=TaskCategory.FEATURE,
        domain="d",
        depends_on=[],
    )


def _learn(*, owner: str = "u1", min_tasks: int = 1, weight: int = 10) -> RuleLearnSkill:
    return RuleLearnSkill(
        id="r_learn",
        owner_id=owner,
        weight=weight,
        params=LearnSkillParams(skill_id=_SKILL, min_tasks=min_tasks),
    )


def test_learn_skill_rule_is_registered() -> None:
    """Acceptance: LEARN_SKILL lives in the global registry."""
    assert RuleType.LEARN_SKILL in REGISTRY


def test_learning_skills_per_user_extracts_enabled_rules_only() -> None:
    """The Λ_j map groups skills per owner and ignores disabled / non-learn rules."""
    rules: list[Rule] = [
        RuleLearnSkill(id="a", owner_id="u1", params=LearnSkillParams(skill_id="py", min_tasks=1)),
        RuleLearnSkill(id="b", owner_id="u1", params=LearnSkillParams(skill_id="js", min_tasks=2)),
        RuleLearnSkill(id="c", owner_id="u2", params=LearnSkillParams(skill_id="py", min_tasks=1)),
        RuleLearnSkill(
            id="d",
            owner_id="u3",
            enabled=False,
            params=LearnSkillParams(skill_id="go", min_tasks=1),
        ),
        RulePreferSkill(id="e", owner_id="u1", params=PreferSkillParams(skill_id="rust")),
    ]
    assert learning_skills_per_user(rules) == {
        "u1": frozenset({"py", "js"}),
        "u2": frozenset({"py"}),
    }


def test_r6_blocks_skill_less_user_without_the_relaxation() -> None:
    """Baseline: without LEARN_SKILL the skill-less owner cannot take the py task."""
    problem = _problem(
        users=[
            User(id="u1", name="U1"),  # no py skill
            User(id="u2", name="U2", skills=[UserSkill(skill_id=_SKILL, level=3)]),
        ],
        tasks=[_py_task("t1")],
    )
    model, vars_ = build_base_model(problem)  # no relaxation map

    solver = cp_model.CpSolver()
    assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
    assert solver.value(vars_.assigned[("t1", "u1")]) == 0  # R6 forbids
    assert solver.value(vars_.assigned[("t1", "u2")]) == 1


def test_learn_skill_relaxes_r6_and_rewards_reaching_min_tasks() -> None:
    """With the relaxation map the skill-less owner can take py tasks, and the
    reward drives them toward min_tasks."""
    rule = _learn(owner="u1", min_tasks=2, weight=10)
    problem = _problem(
        users=[
            User(id="u1", name="U1"),  # no py skill — relaxed by LEARN_SKILL
            User(id="u2", name="U2", skills=[UserSkill(skill_id=_SKILL, level=3)]),
        ],
        tasks=[_py_task("t1"), _py_task("t2"), _py_task("t3")],
    )
    # The orchestration layer derives the map and passes it at build time.
    relaxation = learning_skills_per_user([rule])
    assert relaxation == {"u1": frozenset({_SKILL})}
    model, vars_ = build_base_model(problem, learning_skills_per_user=relaxation)

    term = compile_rule(rule, model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    owner_py_load = sum(solver.value(vars_.assigned[(f"t{i}", "u1")]) for i in (1, 2, 3))
    assert owner_py_load >= 2  # R6 relaxed → skill-less owner takes py tasks
    assert solver.value(term) == 20  # reward capped at weight · min_tasks (10·2)


def test_reward_is_capped_at_min_tasks() -> None:
    """Only one py task available but min_tasks=2 ⇒ partial reward (weight·1)."""
    rule = _learn(owner="u1", min_tasks=2, weight=10)
    problem = _problem(
        users=[User(id="u1", name="U1")],
        tasks=[_py_task("t1")],
    )
    model, vars_ = build_base_model(
        problem, learning_skills_per_user=learning_skills_per_user([rule])
    )
    term = compile_rule(rule, model, vars_)
    assert term is not None
    model.maximize(term)

    solver = cp_model.CpSolver()
    assert solver.solve(model) == cp_model.OPTIMAL
    assert solver.value(term) == 10  # min(count=1, min_tasks=2) · weight


def test_no_matching_task_yields_no_term() -> None:
    """No task requires the skill ⇒ no reward term (None)."""
    problem = _problem(
        users=[User(id="u1", name="U1")],
        tasks=[
            Task(
                id="t1",
                name="t1",
                effort_days=1,
                required_skills=[],
                category=TaskCategory.FEATURE,
                domain="d",
                depends_on=[],
            )
        ],
    )
    model, vars_ = build_base_model(problem)
    assert compile_rule(_learn(), model, vars_) is None


def test_zero_weight_yields_no_term() -> None:
    """A zero-budget rule contributes no reward term."""
    problem = _problem(users=[User(id="u1", name="U1")], tasks=[_py_task("t1")])
    model, vars_ = build_base_model(
        problem, learning_skills_per_user=learning_skills_per_user([_learn(weight=0)])
    )
    assert compile_rule(_learn(weight=0), model, vars_) is None
