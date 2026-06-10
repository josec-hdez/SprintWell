"""Tests for INFEASIBLE / OPTIMAL handling via the solve runner.

See:
- GitHub issue #20.
- sdd/solver-infeasible-handling/explore.
"""

from __future__ import annotations

from datetime import date

from models import (
    EquityMode,
    ProblemInput,
    RunStatus,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from solvers.runner import solve_problem


def _make_problem(
    *,
    users: list[User],
    tasks: list[Task],
    duration_days: int,
    time_budget_s: float = 5.0,
) -> ProblemInput:
    """Construct a minimal ProblemInput for tests."""
    return ProblemInput(
        sprint=Sprint(
            id="sprint-test",
            name="Test sprint",
            start_date=date(2026, 1, 1),
            duration_days=duration_days,
        ),
        users=users,
        tasks=tasks,
        rules=[],
        equity_mode=EquityMode.UTILITARIAN,
        time_budget_s=time_budget_s,
    )


def test_infeasible_returns_friendly_message() -> None:
    """A task with effort_days=5 and deadline_day=1 in a 5-day sprint is INFEASIBLE."""
    problem = _make_problem(
        users=[User(id="u1", name="User 1", skills=[])],
        tasks=[
            Task(
                id="t1",
                name="Big task",
                effort_days=5,
                required_skills=[],
                category=TaskCategory.FEATURE,
                domain="d",
                deadline_day=1,
                depends_on=[],
            )
        ],
        duration_days=5,
    )

    output = solve_problem(problem)

    assert output.status == RunStatus.INFEASIBLE
    assert output.assignments == []
    assert output.objective_value is None
    assert output.per_user_happiness == []
    assert output.rule_evaluations == []
    assert output.message is not None
    assert len(output.message) > 0
    assert "no existe planificación viable" in output.message.lower()
    assert output.solver_stats.solver_status == "INFEASIBLE"


def test_optimal_roundtrip_through_solve_problem() -> None:
    """Happy-path roundtrip: a feasible problem yields OPTIMAL with populated assignments."""
    problem = _make_problem(
        users=[User(id="u1", name="User 1", skills=[])],
        tasks=[
            Task(
                id="t1",
                name="Tiny task",
                effort_days=1,
                required_skills=[],
                category=TaskCategory.FEATURE,
                domain="d",
                depends_on=[],
            )
        ],
        duration_days=5,
    )

    output = solve_problem(problem)

    assert output.status == RunStatus.OPTIMAL
    assert len(output.assignments) == 1
    assert output.assignments[0].task_id == "t1"
    assert output.assignments[0].user_id == "u1"
    assert output.objective_value is not None
    assert output.message is None
    assert output.solver_stats.solver_status == "OPTIMAL"
