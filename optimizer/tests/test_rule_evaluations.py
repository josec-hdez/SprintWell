"""Tests for per-rule explainability evaluation (issue #36).

Most tests drive ``evaluate_rules`` directly with a hand-built assignment so the
fractional ``satisfied`` values are deterministic; one test goes end-to-end
through ``solve_problem`` and checks the coherence invariant between per-rule
``contribution`` and per-user happiness.

See:
- GitHub issue #36.
- Brief §6.3 (rule semantics), §7.3 (happiness), §8.1 (output contract).
"""

from __future__ import annotations

from datetime import date

import pytest

from explainability import evaluate_rules
from models import (
    Assignment,
    BlackoutDateParams,
    CooldownAfterParams,
    LearnSkillParams,
    MaxTasksPerSprintParams,
    PreferCategoryParams,
    ProblemInput,
    RuleBlackoutDate,
    RuleCooldownAfter,
    RuleLearnSkill,
    RuleMaxTasksPerSprint,
    RulePreferCategory,
    Skill,
    Sprint,
    Task,
    TaskCategory,
    User,
    UserSkill,
)
from solvers.runner import solve_problem

_START = date(2026, 5, 4)


def _sprint(duration: int = 5) -> Sprint:
    return Sprint(id="s1", name="Sprint", start_date=_START, duration_days=duration)


def _task(
    id_: str, *, category: TaskCategory = TaskCategory.FEATURE, skills: list[str] | None = None
) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=1,
        required_skills=skills or [],
        category=category,
        domain="d",
        depends_on=[],
    )


def test_prefer_category_satisfied_is_the_fraction() -> None:
    """1 of the owner's 2 tasks is FEATURE ⇒ satisfied 0.5, contribution weight·0.5."""
    problem = ProblemInput(
        sprint=_sprint(),
        users=[User(id="u1", name="U1")],
        tasks=[_task("t1", category=TaskCategory.FEATURE), _task("t2", category=TaskCategory.BUG)],
        rules=[
            RulePreferCategory(
                id="r1",
                owner_id="u1",
                weight=100,
                params=PreferCategoryParams(category=TaskCategory.FEATURE),
            )
        ],
    )
    assignments = [
        Assignment(task_id="t1", user_id="u1", start_day=0),
        Assignment(task_id="t2", user_id="u1", start_day=1),
    ]

    evaluations, happiness = evaluate_rules(problem, assignments)

    assert len(evaluations) == 1
    assert evaluations[0].rule_id == "r1"
    assert evaluations[0].satisfied == 0.5
    assert evaluations[0].contribution == 50.0
    assert len(happiness) == 1
    assert happiness[0].user_id == "u1"
    assert happiness[0].f_j == 0.5


def test_max_tasks_satisfied_decreases_with_overload() -> None:
    """Owner takes 4 tasks under a soft cap of 2 ⇒ satisfied = 2/4 = 0.5."""
    problem = ProblemInput(
        sprint=_sprint(),
        users=[User(id="u1", name="U1")],
        tasks=[_task(f"t{i}") for i in range(4)],
        rules=[
            RuleMaxTasksPerSprint(
                id="r1", owner_id="u1", weight=80, params=MaxTasksPerSprintParams(max_tasks=2)
            )
        ],
    )
    assignments = [Assignment(task_id=f"t{i}", user_id="u1", start_day=i) for i in range(4)]

    evaluations, _ = evaluate_rules(problem, assignments)

    assert evaluations[0].satisfied == 0.5
    assert evaluations[0].contribution == 40.0


def test_learn_skill_satisfied_is_progress_toward_min_tasks() -> None:
    """Owner gets 1 of 2 desired skill tasks ⇒ satisfied = 1/2."""
    problem = ProblemInput(
        sprint=_sprint(),
        users=[User(id="u1", name="U1")],
        tasks=[_task("t1", skills=["py"]), _task("t2")],
        skills=[Skill(id="py", name="Python")],
        rules=[
            RuleLearnSkill(
                id="r1",
                owner_id="u1",
                weight=30,
                params=LearnSkillParams(skill_id="py", min_tasks=2),
            )
        ],
    )
    assignments = [
        Assignment(task_id="t1", user_id="u1", start_day=0),
        Assignment(task_id="t2", user_id="u1", start_day=1),
    ]

    evaluations, _ = evaluate_rules(problem, assignments)

    assert evaluations[0].satisfied == 0.5
    assert evaluations[0].contribution == 15.0


def test_cooldown_violation_lowers_satisfaction() -> None:
    """One on-call task then a task the next day violates the single (a,b) pair."""
    problem = ProblemInput(
        sprint=_sprint(),
        users=[User(id="u1", name="U1")],
        tasks=[_task("a", category=TaskCategory.ON_CALL), _task("b")],
        rules=[
            RuleCooldownAfter(
                id="r1",
                owner_id="u1",
                weight=50,
                params=CooldownAfterParams(after_category=TaskCategory.ON_CALL, rest_days=1),
            )
        ],
    )
    # a on day 0 (ends day 1), b on day 1 → inside the cooldown window → 1/1 pairs violate.
    assignments = [
        Assignment(task_id="a", user_id="u1", start_day=0),
        Assignment(task_id="b", user_id="u1", start_day=1),
    ]

    evaluations, _ = evaluate_rules(problem, assignments)

    assert evaluations[0].satisfied == 0.0  # the only pair violates
    assert evaluations[0].contribution == 0.0


def test_hard_rules_are_excluded() -> None:
    """BLACKOUT_DATE is hard ⇒ it never appears in rule_evaluations."""
    problem = ProblemInput(
        sprint=_sprint(),
        users=[User(id="u1", name="U1")],
        tasks=[_task("t1")],
        rules=[
            RuleBlackoutDate(
                id="r_hard",
                owner_id="u1",
                is_hard=True,
                params=BlackoutDateParams(dates=[_START]),
            )
        ],
    )
    assignments = [Assignment(task_id="t1", user_id="u1", start_day=1)]

    evaluations, happiness = evaluate_rules(problem, assignments)

    assert evaluations == []
    assert happiness == []


def test_end_to_end_contribution_coheres_with_happiness() -> None:
    """f_j equals Σ(contribution)/Σ(weight) over each user's soft rules."""
    problem = ProblemInput(
        sprint=_sprint(),
        users=[
            User(id="u1", name="U1", skills=[UserSkill(skill_id="py", level=3)]),
            User(id="u2", name="U2", skills=[UserSkill(skill_id="py", level=3)]),
        ],
        tasks=[_task("t1", category=TaskCategory.FEATURE), _task("t2", category=TaskCategory.BUG)],
        skills=[Skill(id="py", name="Python")],
        rules=[
            RulePreferCategory(
                id="r1",
                owner_id="u1",
                weight=60,
                params=PreferCategoryParams(category=TaskCategory.FEATURE),
            ),
            RulePreferCategory(
                id="r2",
                owner_id="u2",
                weight=40,
                params=PreferCategoryParams(category=TaskCategory.BUG),
            ),
        ],
    )

    output = solve_problem(problem)

    assert output.status.value in ("OPTIMAL", "FEASIBLE")
    weight_by_owner = {r.id: r.weight for r in problem.rules}
    owner_by_rule: dict[str, str] = {r.id: r.owner_id for r in problem.rules}
    for happiness in output.per_user_happiness:
        owned = [
            e for e in output.rule_evaluations if owner_by_rule[e.rule_id] == happiness.user_id
        ]
        total_weight = sum(weight_by_owner[e.rule_id] for e in owned)
        expected = sum(e.contribution for e in owned) / total_weight
        assert happiness.f_j == pytest.approx(expected)
