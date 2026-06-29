"""Tests for the ``sprintwell-gen`` synthetic instance generator (issue #40).

See:
- GitHub issue #40.
- Brief §9 (generator parameters).
"""

from __future__ import annotations

from pathlib import Path

import pytest

from cli.generator import EXIT_BAD_ARGS, EXIT_OK, generate_instance, main
from models import EquityMode, ProblemInput


def test_same_seed_is_reproducible() -> None:
    """Same parameters + seed ⇒ byte-identical instance."""
    kwargs = dict(
        users=10, tasks=30, days=8, skills=6, rule_density=0.6, conflict_density=0.2, seed=42
    )
    first = generate_instance(**kwargs)  # type: ignore[arg-type]
    second = generate_instance(**kwargs)  # type: ignore[arg-type]
    assert first.model_dump_json() == second.model_dump_json()


def test_different_seed_changes_the_instance() -> None:
    """A different seed produces a different instance."""
    base = dict(users=10, tasks=30, days=8, skills=6, rule_density=0.6, conflict_density=0.2)
    a = generate_instance(seed=1, **base)  # type: ignore[arg-type]
    b = generate_instance(seed=2, **base)  # type: ignore[arg-type]
    assert a.model_dump_json() != b.model_dump_json()


def test_output_validates_against_problem_input() -> None:
    """The generated JSON round-trips through the strict ``ProblemInput`` schema."""
    instance = generate_instance(
        users=12, tasks=40, days=10, skills=8, rule_density=0.7, conflict_density=0.3, seed=7
    )
    reparsed = ProblemInput.model_validate_json(instance.model_dump_json())
    assert len(reparsed.users) == 12
    assert len(reparsed.tasks) == 40
    assert len(reparsed.skills) == 8
    assert reparsed.sprint.duration_days == 10


def test_zero_densities_produce_no_rules() -> None:
    """rule-density 0 and conflict-density 0 ⇒ an instance with no rules."""
    instance = generate_instance(
        users=5, tasks=10, days=5, skills=4, rule_density=0.0, conflict_density=0.0, seed=3
    )
    assert instance.rules == []


def test_skill_free_instance_is_valid() -> None:
    """skills=0 still yields a valid instance (no skill rules, no user skills)."""
    instance = generate_instance(
        users=4, tasks=8, days=4, skills=0, rule_density=1.0, conflict_density=0.0, seed=9
    )
    assert instance.skills == []
    assert all(u.skills == [] for u in instance.users)
    assert all(t.required_skills == [] for t in instance.tasks)


def test_every_task_has_a_capable_user() -> None:
    """Required skills are sampled from a real user, so each task is coverable."""
    instance = generate_instance(
        users=10, tasks=80, days=24, skills=8, rule_density=0.6, conflict_density=0.1, seed=202
    )
    user_skills = [{s.skill_id for s in u.skills} for u in instance.users]
    for task in instance.tasks:
        required = set(task.required_skills)
        assert any(required <= owned for owned in user_skills), task.id


def test_every_skill_has_at_least_two_holders() -> None:
    """The redundancy pass removes single-person skill bottlenecks."""
    instance = generate_instance(
        users=10, tasks=80, days=24, skills=8, rule_density=0.6, conflict_density=0.1, seed=202
    )
    for skill in instance.skills:
        holders = sum(1 for u in instance.users if any(s.skill_id == skill.id for s in u.skills))
        assert holders >= 2, skill.id


def test_dependent_tasks_have_no_deadline() -> None:
    """A predecessor chain plus a tight due date is the classic infeasibility trap."""
    instance = generate_instance(
        users=10, tasks=80, days=24, skills=8, rule_density=0.6, conflict_density=0.1, seed=202
    )
    for task in instance.tasks:
        if task.depends_on:
            assert task.deadline_day is None, task.id


def test_generated_instance_is_feasible() -> None:
    """Regression: the generator must not emit instances the solver proves INFEASIBLE."""
    from models import RunStatus
    from solvers.runner import solve_problem

    instance = generate_instance(
        users=5, tasks=30, days=18, skills=4, rule_density=0.6, conflict_density=0.1, seed=101
    )
    output = solve_problem(instance.model_copy(update={"time_budget_s": 5.0}))
    assert output.status != RunStatus.INFEASIBLE


def test_cli_writes_valid_json_to_stdout(capsys: pytest.CaptureFixture[str]) -> None:
    """``sprintwell-gen ... --out -`` emits a valid ProblemInput to stdout."""
    code = main(
        [
            "--users",
            "3",
            "--tasks",
            "6",
            "--days",
            "5",
            "--skills",
            "3",
            "--seed",
            "11",
            "--out",
            "-",
        ]
    )
    assert code == EXIT_OK
    payload = capsys.readouterr().out
    problem = ProblemInput.model_validate_json(payload)
    assert len(problem.users) == 3
    assert len(problem.tasks) == 6


def test_cli_writes_to_file(tmp_path: Path) -> None:
    """``--out <path>`` writes the instance to disk."""
    out = tmp_path / "instance.json"
    code = main(["--users", "2", "--tasks", "4", "--days", "3", "--skills", "2", "--out", str(out)])
    assert code == EXIT_OK
    problem = ProblemInput.model_validate_json(out.read_text(encoding="utf-8"))
    assert len(problem.tasks) == 4


def test_cli_rejects_bad_arguments(capsys: pytest.CaptureFixture[str]) -> None:
    """Out-of-range parameters exit with the bad-args code."""
    assert main(["--users", "0", "--out", "-"]) == EXIT_BAD_ARGS
    assert main(["--rule-density", "1.5", "--out", "-"]) == EXIT_BAD_ARGS


def test_equity_mode_is_recorded_on_the_instance() -> None:
    """The ``equity_mode`` argument is reflected on the generated instance."""
    instance = generate_instance(
        users=3,
        tasks=5,
        days=5,
        skills=2,
        rule_density=0.5,
        conflict_density=0.0,
        seed=1,
        equity_mode=EquityMode.NASH,
    )
    assert instance.equity_mode == EquityMode.NASH


def test_cli_equity_mode_flag(capsys: pytest.CaptureFixture[str]) -> None:
    """``--equity-mode max-min`` produces an instance tagged MAX_MIN."""
    code = main(
        [
            "--users",
            "2",
            "--tasks",
            "3",
            "--days",
            "4",
            "--skills",
            "1",
            "--equity-mode",
            "max-min",
            "--out",
            "-",
        ]
    )
    assert code == EXIT_OK
    problem = ProblemInput.model_validate_json(capsys.readouterr().out)
    assert problem.equity_mode == EquityMode.MAX_MIN
