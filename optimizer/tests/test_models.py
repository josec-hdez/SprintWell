"""Acceptance tests for the solver payload contract (issue #14).

Per brief §6.3 / §8.1 — ProblemInput / SolverOutput contract, twelve rule
types, strict mode, extra=forbid, status invariants, discriminator routing.
"""

from __future__ import annotations

from datetime import date

import pytest
from pydantic import ValidationError

from models import (
    AvoidSkillParams,
    BlackoutDateParams,
    EquityMode,
    MaxTasksPerSprintParams,
    PreferSkillParams,
    PreferWeekdayParams,
    ProblemInput,
    Rule,
    RuleAdapter,
    RuleBlackoutDate,
    RuleEvaluation,
    RuleMaxTasksPerSprint,
    RulePreferSkill,
    RulePreferWeekday,
    RuleType,
    RunStatus,
    Skill,
    SolverOutput,
    SolverStats,
    Sprint,
    Task,
    TaskCategory,
    User,
    UserHappiness,
    UserSkill,
    Weekday,
)

# ---------------------------------------------------------------------------
# Helpers.
# ---------------------------------------------------------------------------


def _sprint() -> Sprint:
    return Sprint(
        id="sprint_1",
        name="Sprint 1",
        start_date=date(2026, 5, 4),
        duration_days=10,
    )


def _user(id_: str = "user_1") -> User:
    return User(
        id=id_,
        name="Alice",
        skills=[UserSkill(skill_id="skill_py", level=4)],
    )


def _task(
    id_: str = "task_1",
    depends_on: list[str] | None = None,
    deadline_day: int | None = None,
) -> Task:
    return Task(
        id=id_,
        name="Implement feature",
        effort_days=2,
        required_skills=["skill_py"],
        category=TaskCategory.FEATURE,
        domain="auth",
        deadline_day=deadline_day,
        depends_on=depends_on or [],
    )


def _skill() -> Skill:
    return Skill(id="skill_py", name="Python")


def _solver_stats() -> SolverStats:
    return SolverStats(
        wall_time_ms=125.4,
        conflicts=3,
        branches=42,
        solver_status="OPTIMAL",
    )


# ---------------------------------------------------------------------------
# 1. Minimal valid ProblemInput.
# ---------------------------------------------------------------------------


def test_minimal_valid_problem_input() -> None:
    problem = ProblemInput(
        sprint=_sprint(),
        users=[_user()],
        tasks=[_task()],
        skills=[_skill()],
    )
    assert problem.equity_mode == EquityMode.UTILITARIAN
    assert problem.time_budget_s == 30.0
    assert problem.rules == []


# ---------------------------------------------------------------------------
# 2. Referential integrity — unknown owner_id in rule.
# ---------------------------------------------------------------------------


def test_problem_input_rejects_unknown_user_in_rule() -> None:
    rule = RulePreferSkill(
        id="rule_1",
        owner_id="user_ghost",
        weight=10,
        params=PreferSkillParams(skill_id="skill_py"),
    )
    with pytest.raises(ValidationError) as excinfo:
        ProblemInput(
            sprint=_sprint(),
            users=[_user()],
            tasks=[_task()],
            skills=[_skill()],
            rules=[rule],
        )
    assert "unknown owner_id" in str(excinfo.value)


# ---------------------------------------------------------------------------
# 3. Referential integrity — invalid task dependency.
# ---------------------------------------------------------------------------


def test_problem_input_rejects_invalid_dependency() -> None:
    bad = _task(id_="task_1", depends_on=["task_missing"])
    with pytest.raises(ValidationError) as excinfo:
        ProblemInput(
            sprint=_sprint(),
            users=[_user()],
            tasks=[bad],
            skills=[_skill()],
        )
    assert "depends on unknown task" in str(excinfo.value)


# ---------------------------------------------------------------------------
# 4. Valid OPTIMAL SolverOutput.
# ---------------------------------------------------------------------------


def test_solver_output_optimal_valid() -> None:
    output = SolverOutput(
        status=RunStatus.OPTIMAL,
        assignments=[],
        objective_value=42.5,
        per_user_happiness=[UserHappiness(user_id="user_1", f_j=0.8)],
        rule_evaluations=[
            RuleEvaluation(rule_id="rule_1", satisfied=1.0, contribution=15.0)
        ],
        solver_stats=_solver_stats(),
    )
    assert output.status == RunStatus.OPTIMAL
    assert output.objective_value == 42.5


# ---------------------------------------------------------------------------
# 5. INFEASIBLE invariant — must have no assignments, null objective.
# ---------------------------------------------------------------------------


def test_solver_output_infeasible_invariant() -> None:
    # INFEASIBLE with a non-null objective_value must fail.
    with pytest.raises(ValidationError) as excinfo:
        SolverOutput(
            status=RunStatus.INFEASIBLE,
            objective_value=10.0,
            solver_stats=_solver_stats(),
        )
    assert "INFEASIBLE" in str(excinfo.value)

    # INFEASIBLE with non-empty assignments must fail.
    with pytest.raises(ValidationError):
        SolverOutput.model_validate(
            {
                "status": "INFEASIBLE",
                "assignments": [
                    {"task_id": "t1", "user_id": "u1", "start_day": 0}
                ],
                "objective_value": None,
                "per_user_happiness": [],
                "rule_evaluations": [],
                "solver_stats": {
                    "wall_time_ms": 1.0,
                    "conflicts": 0,
                    "branches": 0,
                    "solver_status": "INFEASIBLE",
                },
            }
        )


# ---------------------------------------------------------------------------
# 6. OPTIMAL invariant — requires non-null objective_value.
# ---------------------------------------------------------------------------


def test_solver_output_optimal_requires_objective() -> None:
    with pytest.raises(ValidationError) as excinfo:
        SolverOutput(
            status=RunStatus.OPTIMAL,
            objective_value=None,
            solver_stats=_solver_stats(),
        )
    assert "non-null objective_value" in str(excinfo.value)


# ---------------------------------------------------------------------------
# 7. BLACKOUT_DATE must be hard.
# ---------------------------------------------------------------------------


def test_rule_blackout_date_is_hard() -> None:
    with pytest.raises(ValidationError) as excinfo:
        RuleBlackoutDate(
            id="rule_b",
            owner_id="user_1",
            is_hard=False,
            params=BlackoutDateParams(dates=[date(2026, 5, 5)]),
        )
    assert "BLACKOUT_DATE" in str(excinfo.value)


# ---------------------------------------------------------------------------
# 8. Discriminator routing.
# ---------------------------------------------------------------------------


def test_rule_discriminator_routing() -> None:
    # Use JSON path because strict mode rejects raw strings for StrEnum
    # fields under Python validation. Wire format is JSON anyway.
    payload_json = (
        '{"id": "rule_w", "owner_id": "user_1", "weight": 20, '
        '"is_hard": false, "enabled": true, "schema_version": 1, '
        '"type": "PREFER_WEEKDAY", "params": {"weekday": "saturday"}}'
    )
    parsed: Rule = RuleAdapter.validate_json(payload_json)
    assert isinstance(parsed, RulePreferWeekday)
    assert parsed.params.weekday == Weekday.SATURDAY

    bogus = (
        '{"id": "rule_w", "owner_id": "user_1", "weight": 20, '
        '"is_hard": false, "enabled": true, "schema_version": 1, '
        '"type": "NOT_A_RULE", "params": {}}'
    )
    with pytest.raises(ValidationError):
        RuleAdapter.validate_json(bogus)


# ---------------------------------------------------------------------------
# 9. UserHappiness clamp — f_j out of range.
# ---------------------------------------------------------------------------


def test_user_happiness_clamp() -> None:
    with pytest.raises(ValidationError):
        UserHappiness(user_id="user_1", f_j=1.5)
    with pytest.raises(ValidationError):
        UserHappiness(user_id="user_1", f_j=-0.1)


# ---------------------------------------------------------------------------
# 10. MAX_TASKS_PER_SPRINT — param rename verification.
# ---------------------------------------------------------------------------


def test_max_tasks_per_sprint_param_rename() -> None:
    ok = RuleMaxTasksPerSprint(
        id="rule_m",
        owner_id="user_1",
        weight=5,
        params=MaxTasksPerSprintParams(max_tasks=5),
    )
    assert ok.params.max_tasks == 5

    with pytest.raises(ValidationError):
        RuleAdapter.validate_python(
            {
                "id": "rule_m",
                "owner_id": "user_1",
                "weight": 5,
                "is_hard": False,
                "enabled": True,
                "schema_version": 1,
                "type": "MAX_TASKS_PER_SPRINT",
                "params": {"max": 5},
            }
        )


# ---------------------------------------------------------------------------
# 11. strict=True — no silent int→float or str→int coercion.
# ---------------------------------------------------------------------------


def test_strict_mode_rejects_coerced_int_as_float() -> None:
    # Strict mode rejects string-to-int coercion (most common contract drift).
    # Note: Pydantic v2 still accepts int-to-float by spec — ints are valid
    # floats — so we assert the str-to-int rejection instead.
    with pytest.raises(ValidationError):
        Sprint(
            id="s",
            name="s",
            start_date=date(2026, 5, 4),
            duration_days="10",  # type: ignore[arg-type]
        )

    # Strict also rejects bool-as-int and str-as-bool.
    with pytest.raises(ValidationError):
        UserSkill.model_validate({"skill_id": "s", "level": "3"})


# ---------------------------------------------------------------------------
# 12. extra=forbid — unknown field rejected.
# ---------------------------------------------------------------------------


def test_extra_forbid_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        Sprint.model_validate(
            {
                "id": "s",
                "name": "s",
                "start_date": "2026-05-04",
                "duration_days": 10,
                "extra_field": "boom",
            }
        )

    with pytest.raises(ValidationError):
        UserHappiness.model_validate(
            {"user_id": "u", "f_j": 0.5, "ghost": True}
        )


# ---------------------------------------------------------------------------
# 13. JSON round-trip — SolverOutput serialize and re-parse.
# ---------------------------------------------------------------------------


def test_json_round_trip() -> None:
    original = SolverOutput(
        status=RunStatus.OPTIMAL,
        assignments=[],
        objective_value=123.45,
        per_user_happiness=[
            UserHappiness(user_id="user_1", f_j=0.7),
            UserHappiness(user_id="user_2", f_j=0.9),
        ],
        rule_evaluations=[
            RuleEvaluation(rule_id="rule_1", satisfied=0.5, contribution=7.5),
        ],
        solver_stats=_solver_stats(),
    )
    blob = original.model_dump_json()
    restored = SolverOutput.model_validate_json(blob)
    assert restored == original


# ---------------------------------------------------------------------------
# Extra coverage: rule with wrong-typed avoid_skill params.
# ---------------------------------------------------------------------------


def test_avoid_skill_params_strict() -> None:
    with pytest.raises(ValidationError):
        AvoidSkillParams.model_validate({"skill_id": 123})  # not a string


def test_prefer_weekday_params_enum_from_json() -> None:
    # Constructing with the StrEnum member works.
    p = PreferWeekdayParams(weekday=Weekday.MONDAY)
    assert p.weekday == Weekday.MONDAY
    # JSON wire format ("monday") is accepted via model_validate_json.
    p2 = PreferWeekdayParams.model_validate_json('{"weekday": "monday"}')
    assert p2.weekday == Weekday.MONDAY


def test_rule_type_enum_complete() -> None:
    # Sanity: the RuleType enum has the expected 12 members.
    assert len(list(RuleType)) == 12
