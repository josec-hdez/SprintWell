"""Tests for the optimizer CLI (issue #23).

The CLI lives at ``optimizer/src/cli/`` and is invoked as ``python -m cli`` or
via the ``sprintwell-solve`` script entry point. These tests exercise
``cli.main`` directly (no subprocess) so coverage stays fast and reliable.

See:
- GitHub issue #23.
- sdd/cli-solver-runner/explore.
"""

from __future__ import annotations

import math
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api import app
from cli import main
from models import (
    Assignment,
    EquityMode,
    ProblemInput,
    RunStatus,
    SolverOutput,
    Sprint,
    Task,
    TaskCategory,
    User,
)


def _make_problem(*, effort: int, deadline: int | None, duration: int) -> ProblemInput:
    """Build a 1-user / 1-task ProblemInput for CLI tests.

    Mirrors the helper in ``test_solve_endpoint.py`` so endpoint-parity test
    compares apples to apples.
    """
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


def _write_problem(tmp_path: Path, problem: ProblemInput) -> Path:
    path = tmp_path / "instance.json"
    path.write_text(problem.model_dump_json(), encoding="utf-8")
    return path


def _assignment_set(assignments: list[Assignment]) -> set[tuple[str, str, int]]:
    """Order-insensitive comparison of assignment lists."""
    return {(a.task_id, a.user_id, a.start_day) for a in assignments}


def test_cli_solve_writes_optimal_to_file(tmp_path: Path) -> None:
    in_path = _write_problem(tmp_path, _make_problem(effort=1, deadline=None, duration=5))
    out_path = tmp_path / "result.json"

    rc = main(["solve", "-i", str(in_path), "-o", str(out_path), "--quiet"])

    assert rc == 0
    output = SolverOutput.model_validate_json(out_path.read_text(encoding="utf-8"))
    assert output.status == RunStatus.OPTIMAL
    assert len(output.assignments) == 1
    assert output.assignments[0].task_id == "t1"
    assert output.assignments[0].user_id == "u1"


def test_cli_solve_writes_to_stdout(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    in_path = _write_problem(tmp_path, _make_problem(effort=1, deadline=None, duration=5))

    rc = main(["solve", "-i", str(in_path), "-o", "-", "--quiet"])

    assert rc == 0
    captured = capsys.readouterr()
    output = SolverOutput.model_validate_json(captured.out)
    assert output.status == RunStatus.OPTIMAL
    # Sanity: no informational output leaked to stderr while --quiet is on.
    assert captured.err == ""


def test_cli_solve_returns_exit_1_on_infeasible(tmp_path: Path) -> None:
    # effort=5 with deadline_day=1 in a 5-day sprint passes Pydantic but is
    # infeasible at the solver level.
    in_path = _write_problem(tmp_path, _make_problem(effort=5, deadline=1, duration=5))
    out_path = tmp_path / "result.json"

    rc = main(["solve", "-i", str(in_path), "-o", str(out_path), "--quiet"])

    assert rc == 1
    output = SolverOutput.model_validate_json(out_path.read_text(encoding="utf-8"))
    assert output.status == RunStatus.INFEASIBLE
    assert output.assignments == []
    assert output.message is not None and len(output.message) > 0


def test_cli_solve_returns_exit_2_on_malformed_json(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    in_path = tmp_path / "bad.json"
    in_path.write_bytes(b"not json at all")
    out_path = tmp_path / "result.json"

    rc = main(["solve", "-i", str(in_path), "-o", str(out_path), "--quiet"])

    assert rc == 2
    captured = capsys.readouterr()
    assert captured.err != ""
    # Out file MUST NOT be created when validation fails — would mislead callers.
    assert not out_path.exists()


def test_cli_solve_returns_exit_3_on_missing_input(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    in_path = tmp_path / "does-not-exist.json"
    out_path = tmp_path / "result.json"

    rc = main(["solve", "-i", str(in_path), "-o", str(out_path), "--quiet"])

    assert rc == 3
    captured = capsys.readouterr()
    assert "not found" in captured.err.lower()


def test_cli_endpoint_parity(tmp_path: Path) -> None:
    """Acceptance criterion: CLI output matches POST /solve for the same instance."""
    problem = _make_problem(effort=1, deadline=None, duration=5)
    in_path = _write_problem(tmp_path, problem)
    out_path = tmp_path / "result.json"

    rc = main(["solve", "-i", str(in_path), "-o", str(out_path), "--quiet"])
    assert rc == 0
    cli_output = SolverOutput.model_validate_json(out_path.read_text(encoding="utf-8"))

    client = TestClient(app)
    response = client.post(
        "/solve",
        content=problem.model_dump_json(),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    # Use model_validate_json on the raw response text — the strict config on
    # SolverOutput rejects the JSON-string forms (e.g. "OPTIMAL") when going
    # through the Python-dict validator. Same trap as the endpoint in #22.
    api_output = SolverOutput.model_validate_json(response.text)

    # status, assignments, objective_value and message must be identical.
    assert cli_output.status == api_output.status
    assert _assignment_set(cli_output.assignments) == _assignment_set(api_output.assignments)
    assert cli_output.objective_value is not None
    assert api_output.objective_value is not None
    assert math.isclose(cli_output.objective_value, api_output.objective_value)
    assert cli_output.message == api_output.message
    # solver_stats.wall_time_ms / conflicts / branches are timing-dependent;
    # deliberately not compared.
