"""Tests for POST /solve endpoint.

See:
- GitHub issue #22.
- Brief §4.3 (microservice frontier) and §8.1 (output contract).
"""
from datetime import date

from fastapi.testclient import TestClient

from api import app
from models import (
    EquityMode,
    ProblemInput,
    RunStatus,
    Sprint,
    Task,
    TaskCategory,
    User,
)

client = TestClient(app)


def _make_minimal_problem(*, effort: int, deadline: int | None, duration: int) -> ProblemInput:
    """Build a 1-user / 1-task problem for endpoint tests."""
    return ProblemInput(
        sprint=Sprint(
            id="sprint-test",
            name="Test sprint",
            start_date=date(2026, 1, 1),
            duration_days=duration,
        ),
        users=[User(id="u1", name="Alice", skills=[])],
        tasks=[
            Task(
                id="t1",
                name="Tiny task",
                effort_days=effort,
                required_skills=[],
                depends_on=[],
                category=TaskCategory.FEATURE,
                domain="d",
                deadline_day=deadline,
            )
        ],
        rules=[],
        equity_mode=EquityMode.UTILITARIAN,
        time_budget_s=5.0,
    )


def test_solve_endpoint_returns_optimal_on_happy_path() -> None:
    problem = _make_minimal_problem(effort=1, deadline=None, duration=5)
    response = client.post(
        "/solve",
        content=problem.model_dump_json(),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == RunStatus.OPTIMAL.value
    assert len(body["assignments"]) == 1
    assert body["assignments"][0]["task_id"] == "t1"
    assert body["assignments"][0]["user_id"] == "u1"
    assert body["objective_value"] is not None
    assert body["message"] is None
    # solver_stats includes wall_time_ms (per acceptance criterion).
    assert "wall_time_ms" in body["solver_stats"]
    assert body["solver_stats"]["wall_time_ms"] >= 0


def test_solve_endpoint_returns_infeasible_with_message() -> None:
    # effort=5, deadline=1 in a 5-day sprint — passes Pydantic, INFEASIBLE at solver.
    problem = _make_minimal_problem(effort=5, deadline=1, duration=5)
    response = client.post(
        "/solve",
        content=problem.model_dump_json(),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == RunStatus.INFEASIBLE.value
    assert body["assignments"] == []
    assert body["objective_value"] is None
    assert body["message"] is not None and len(body["message"]) > 0


def test_solve_endpoint_rejects_malformed_body() -> None:
    """FastAPI returns 422 for invalid Pydantic bodies."""
    response = client.post("/solve", json={"this": "is not a ProblemInput"})
    assert response.status_code == 422
    # Sanity: the response body is the FastAPI validation error envelope.
    assert "detail" in response.json()


def test_solve_endpoint_respects_time_budget() -> None:
    """time_budget_s in body controls the solver's budget."""
    problem = _make_minimal_problem(effort=1, deadline=None, duration=5)
    problem = problem.model_copy(update={"time_budget_s": 0.1})
    response = client.post(
        "/solve",
        content=problem.model_dump_json(),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    body = response.json()
    # On a tiny problem 0.1s is plenty — should reach OPTIMAL.
    assert body["status"] == RunStatus.OPTIMAL.value
    # wall_time_ms should be small (sanity).
    assert body["solver_stats"]["wall_time_ms"] < 1000  # << 1 second
