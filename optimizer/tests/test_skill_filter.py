"""Acceptance tests for R6 skill-filter (issue #21).

See:
- GitHub issue #21.
- sdd/solver-r6-skill-filter/explore.
- Brief §7.2 R6 + thesis §3.3 eq (3.6).
"""

from __future__ import annotations

from datetime import date

from ortools.sat.python import cp_model

from models import (
    ProblemInput,
    RunStatus,
    Skill,
    Sprint,
    Task,
    TaskCategory,
    User,
    UserSkill,
)
from solvers import attach_trivial_objective, build_base_model
from solvers.runner import solve_problem


def _problem(
    *,
    users: list[User],
    tasks: list[Task],
    skills: list[Skill] | None = None,
    duration_days: int = 5,
    time_budget_s: float = 5.0,
) -> ProblemInput:
    return ProblemInput(
        sprint=Sprint(
            id="sprint_1",
            name="Sprint",
            start_date=date(2026, 5, 4),
            duration_days=duration_days,
        ),
        users=users,
        tasks=tasks,
        skills=skills or [],
        time_budget_s=time_budget_s,
    )


def _task(
    id_: str,
    *,
    required_skills: list[str] | None = None,
    effort: int = 1,
) -> Task:
    return Task(
        id=id_,
        name=id_,
        effort_days=effort,
        required_skills=required_skills or [],
        category=TaskCategory.FEATURE,
        domain="d",
        depends_on=[],
    )


def test_user_without_required_skill_is_excluded() -> None:
    """R6 hard-excludes a user who lacks the required skill (brief §7.2)."""
    problem = _problem(
        users=[
            User(
                id="u_yes",
                name="Yes",
                skills=[UserSkill(skill_id="skill_py", level=3)],
            ),
            User(id="u_no", name="No", skills=[]),
        ],
        tasks=[_task("t1", required_skills=["skill_py"])],
        skills=[Skill(id="skill_py", name="Python")],
    )
    model, vars_ = build_base_model(problem)
    attach_trivial_objective(model, vars_)
    solver = cp_model.CpSolver()
    status = solver.solve(model)

    assert status == cp_model.OPTIMAL
    assert solver.value(vars_.assigned[("t1", "u_yes")]) == 1
    assert solver.value(vars_.assigned[("t1", "u_no")]) == 0


def test_no_eligible_user_yields_infeasible() -> None:
    """No user has the required skill ⇒ R1 + R6 collapse to INFEASIBLE.

    Exercises the end-to-end path through ``solve_problem`` (issue #20):
    the runner must report ``RunStatus.INFEASIBLE`` with a non-empty
    friendly message and zero assignments.
    """
    problem = _problem(
        users=[
            User(id="u1", name="U1", skills=[]),
            User(id="u2", name="U2", skills=[]),
        ],
        tasks=[_task("t1", required_skills=["skill_py"])],
        skills=[Skill(id="skill_py", name="Python")],
    )
    output = solve_problem(problem)

    assert output.status == RunStatus.INFEASIBLE
    assert output.assignments == []
    assert output.objective_value is None
    assert output.message is not None and len(output.message) > 0


def test_task_with_no_required_skills_accepts_any_user() -> None:
    """Empty ``required_skills`` ⇒ R6 adds no constraints (D6)."""
    problem = _problem(
        users=[
            User(id="u1", name="U1", skills=[]),
            User(id="u2", name="U2", skills=[]),
        ],
        tasks=[_task("t1", required_skills=[])],
    )
    model, vars_ = build_base_model(problem)
    attach_trivial_objective(model, vars_)
    solver = cp_model.CpSolver()
    status = solver.solve(model)

    assert status == cp_model.OPTIMAL
    assigned_sum = sum(
        solver.value(vars_.assigned[("t1", u.id)]) for u in problem.users
    )
    assert assigned_sum == 1  # R1 holds, R6 added nothing
