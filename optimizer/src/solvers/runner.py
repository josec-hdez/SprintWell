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

from explainability import evaluate_rules
from models import (
    Assignment,
    ProblemInput,
    RunStatus,
    SolverOutput,
    SolverStats,
)

from .cpsat import BaseModelVars, attach_equity_objective, build_base_model

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
        f"Se alcanzó el tiempo máximo ({wall_seconds:.1f} s) sin encontrar una solución factible."
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
    # Per-rule explainability and per-user happiness from the chosen schedule.
    rule_evaluations, per_user_happiness = evaluate_rules(vars.problem, assignments)

    if status == cp_model.OPTIMAL:
        return SolverOutput(
            status=RunStatus.OPTIMAL,
            assignments=assignments,
            objective_value=objective_value,
            per_user_happiness=per_user_happiness,
            rule_evaluations=rule_evaluations,
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
            per_user_happiness=per_user_happiness,
            rule_evaluations=rule_evaluations,
            solver_stats=make_stats("FEASIBLE"),
            message=_timeout_message_with_solution(wall_seconds),
        )

    return SolverOutput(
        status=RunStatus.FEASIBLE,
        assignments=assignments,
        objective_value=objective_value,
        per_user_happiness=per_user_happiness,
        rule_evaluations=rule_evaluations,
        solver_stats=make_stats("FEASIBLE"),
        message=None,
    )


def solve_problem(problem: ProblemInput) -> SolverOutput:
    """End-to-end: build the base model, compile rules, aggregate by equity mode, solve.

    LEARN_SKILL rules relax R6, so their map is derived first and fed to
    ``build_base_model`` (R6 is a build-time pre-filter). Soft rules are then
    compiled and grouped per owner, and aggregated under the problem's
    ``equity_mode`` (brief §7.4). With no soft rules the equity attacher falls
    back to the trivial makespan objective.
    """
    # Imported lazily to break the import cycle: ``rule_compiler`` imports
    # ``solvers.cpsat`` (triggering this package's __init__, which imports this
    # module), so a top-level import here would be circular.
    from rule_compiler import compile_by_owner
    from rule_compiler.learn_skill import learning_skills_per_user

    relaxation = learning_skills_per_user(problem.rules)
    model, model_vars = build_base_model(problem, learning_skills_per_user=relaxation)
    per_user_terms = compile_by_owner(problem.rules, model, model_vars)
    attach_equity_objective(model, model_vars, per_user_terms)
    return solve(model, model_vars, time_budget_s=problem.time_budget_s)
