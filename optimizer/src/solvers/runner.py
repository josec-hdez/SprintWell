"""Solve runner for the CP-SAT model.

Wraps ``cp_model.CpSolver`` and maps OR-Tools statuses to ``SolverOutput``
per brief §8.1. Friendly ``INFEASIBLE`` / ``TIMEOUT`` messages are hardcoded
Spanish copy (assumption-based diagnosis is deferred to Semana 9).

See:
- GitHub issue #20.
- sdd/solver-infeasible-handling/explore.
"""

from __future__ import annotations

from typing import Any

from ortools.sat.python import cp_model

from models import (
    Assignment,
    ProblemInput,
    RunStatus,
    SolverOutput,
    SolverStats,
)

from .cpsat import BaseModelVars, attach_trivial_objective, build_base_model

__all__ = ["solve", "solve_problem"]

_INFEASIBLE_MESSAGE = (
    "No existe planificación viable con las restricciones actuales. "
    "Causas más probables: dependencias circulares, deadlines imposibles "
    "para el esfuerzo requerido, o falta de capacidad en el horizonte del sprint."
)


def _timeout_message_with_solution(wall_seconds: float) -> str:
    return (
        f"Se alcanzó el tiempo máximo ({wall_seconds:.1f} s) antes de probar "
        "optimalidad. La solución devuelta es factible pero puede no ser óptima."
    )


def _timeout_message_no_solution(wall_seconds: float) -> str:
    return (
        f"Se alcanzó el tiempo máximo ({wall_seconds:.1f} s) sin encontrar "
        "una solución factible."
    )


def _extract_assignments(solver: Any, vars: BaseModelVars) -> list[Assignment]:
    """Read the BoolVars; collect (task_id, user_id, start_day) triples for x=1."""
    result: list[Assignment] = []
    for (task_id, user_id), bool_var in vars.assigned.items():
        if solver.value(bool_var) == 1:
            start_day = solver.value(vars.start[task_id])
            result.append(
                Assignment(
                    task_id=task_id,
                    user_id=user_id,
                    start_day=int(start_day),
                )
            )
    return result


def solve(model: Any, vars: BaseModelVars, *, time_budget_s: float) -> SolverOutput:
    """Solve a pre-built CP-SAT model and produce a ``SolverOutput`` per brief §8.1.

    The model is expected to already have whatever objective is desired
    attached (e.g. via :func:`attach_trivial_objective` or a future equity
    attacher). ``MODEL_INVALID`` raises — that indicates a builder bug, not
    a problem-side issue.
    """
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_budget_s
    status = solver.solve(model)
    wall_seconds = float(solver.wall_time)
    wall_time_ms = wall_seconds * 1000.0

    def make_stats(raw_status: str) -> SolverStats:
        return SolverStats(
            wall_time_ms=wall_time_ms,
            conflicts=int(solver.num_conflicts),
            branches=int(solver.num_branches),
            solver_status=raw_status,
        )

    if status == cp_model.MODEL_INVALID:
        raise RuntimeError(
            "CP-SAT reported MODEL_INVALID — this indicates a builder bug, "
            "not a problem-side infeasibility. Inspect the model construction."
        )

    if status == cp_model.INFEASIBLE:
        return SolverOutput(
            status=RunStatus.INFEASIBLE,
            assignments=[],
            objective_value=None,
            per_user_happiness=[],
            rule_evaluations=[],
            solver_stats=make_stats("INFEASIBLE"),
            message=_INFEASIBLE_MESSAGE,
        )

    if status == cp_model.UNKNOWN:
        # No feasible solution found before time budget exhaustion.
        return SolverOutput(
            status=RunStatus.TIMEOUT,
            assignments=[],
            objective_value=None,
            per_user_happiness=[],
            rule_evaluations=[],
            solver_stats=make_stats("UNKNOWN"),
            message=_timeout_message_no_solution(wall_seconds),
        )

    # Status is OPTIMAL or FEASIBLE — we have a solution.
    assignments = _extract_assignments(solver, vars)
    objective_value = float(solver.objective_value)

    if status == cp_model.OPTIMAL:
        return SolverOutput(
            status=RunStatus.OPTIMAL,
            assignments=assignments,
            objective_value=objective_value,
            per_user_happiness=[],
            rule_evaluations=[],
            solver_stats=make_stats("OPTIMAL"),
            message=None,
        )

    # status == cp_model.FEASIBLE.
    # Escalate to TIMEOUT if wall_time hit the budget (tolerance for clock jitter).
    if wall_seconds >= time_budget_s * 0.999:
        return SolverOutput(
            status=RunStatus.TIMEOUT,
            assignments=assignments,
            objective_value=objective_value,
            per_user_happiness=[],
            rule_evaluations=[],
            solver_stats=make_stats("FEASIBLE"),
            message=_timeout_message_with_solution(wall_seconds),
        )

    return SolverOutput(
        status=RunStatus.FEASIBLE,
        assignments=assignments,
        objective_value=objective_value,
        per_user_happiness=[],
        rule_evaluations=[],
        solver_stats=make_stats("FEASIBLE"),
        message=None,
    )


def solve_problem(problem: ProblemInput) -> SolverOutput:
    """End-to-end: build the base model, attach trivial objective, solve, report."""
    model, model_vars = build_base_model(problem)
    attach_trivial_objective(model, model_vars)
    return solve(model, model_vars, time_budget_s=problem.time_budget_s)
