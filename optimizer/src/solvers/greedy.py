"""Greedy skill-match baseline solver (issue #39).

Brief §8.3: the *fair competitor* for CP-SAT — what a classic tool (Jira/Linear)
would do, assigning by capacity and skill-match while ignoring preferences
entirely. It shows how much wellbeing a sensible-but-preference-blind allocation
leaves on the table.

Algorithm (constructive, no CP-SAT):

1. Process tasks in dependency-respecting order; among the tasks whose
   dependencies are already placed, pick the next by ``(most required skills,
   earliest deadline)``.
2. For that task, choose the user with the best skill-match who has a feasible
   slot, placing it at that user's earliest valid start day (respecting R2
   no-overlap, R3 horizon, R4 deadline, R5 dependencies).

It uses skills only to *rank* candidates (R6 is not enforced — a task may land
on an imperfect match if nothing better is free) and never looks at preference
rules. The resulting schedule flows through :func:`explainability.evaluate_rules`
so the benchmark can read the happiness this blind baseline achieves.

If a task cannot be placed within the horizon/deadline by any user, the instance
is reported ``INFEASIBLE`` for this heuristic (greedy is incomplete by design).

See:
- GitHub issue #39.
- Brief §8.3 (greedy baseline), §7.2 (structural constraints).
"""

from __future__ import annotations

from explainability import evaluate_rules
from models import (
    Assignment,
    ProblemInput,
    RunStatus,
    SolverOutput,
    SolverStats,
    Task,
    User,
)

__all__ = ["solve_greedy"]

_GREEDY_INFEASIBLE_MESSAGE = (
    "El baseline greedy no encontró una ubicación válida para todas las tareas "
    "(deadlines o capacidad del sprint demasiado ajustados para la heurística). "
    "Esto no implica que el problema sea infactible para CP-SAT."
)


def _skill_match(user: User, task: Task) -> int:
    """Number of the task's required skills the user holds (level ≥ 1)."""
    owned = {s.skill_id for s in user.skills}
    return sum(1 for skill_id in task.required_skills if skill_id in owned)


def _earliest_start(
    busy: list[tuple[int, int]], min_start: int, task: Task, horizon: int
) -> int | None:
    """Earliest start ≥ ``min_start`` with no overlap, within horizon and deadline."""
    latest = horizon - task.effort_days
    if task.deadline_day is not None:
        latest = min(latest, task.deadline_day + 1 - task.effort_days)
    for start in range(min_start, latest + 1):
        end = start + task.effort_days
        if all(end <= b_start or start >= b_end for b_start, b_end in busy):
            return start
    return None


def _infeasible(stats: SolverStats) -> SolverOutput:
    return SolverOutput(
        status=RunStatus.INFEASIBLE,
        assignments=[],
        objective_value=None,
        per_user_happiness=[],
        rule_evaluations=[],
        solver_stats=stats,
        message=_GREEDY_INFEASIBLE_MESSAGE,
    )


def solve_greedy(problem: ProblemInput) -> SolverOutput:
    """Solve with the preference-blind greedy skill-match baseline."""
    horizon = problem.sprint.duration_days
    stats = SolverStats(wall_time_ms=0.0, conflicts=0, branches=0, solver_status="GREEDY")

    busy: dict[str, list[tuple[int, int]]] = {u.id: [] for u in problem.users}
    end_of: dict[str, int] = {}
    placed: dict[str, Assignment] = {}
    remaining = {t.id: t for t in problem.tasks}

    while remaining:
        ready = [t for t in remaining.values() if all(dep in placed for dep in t.depends_on)]
        if not ready:  # pragma: no cover - dependencies are validated acyclic
            return _infeasible(stats)
        # Most required skills first, then earliest deadline, then id for stability.
        ready.sort(
            key=lambda t: (
                -len(t.required_skills),
                t.deadline_day if t.deadline_day is not None else horizon + 1,
                t.id,
            )
        )
        task = ready[0]
        min_start = max((end_of[dep] for dep in task.depends_on), default=0)

        # Best skill-match, then that user's earliest feasible window.
        best: tuple[int, int, str] | None = None
        for user in problem.users:
            start = _earliest_start(busy[user.id], min_start, task, horizon)
            if start is None:
                continue
            candidate = (-_skill_match(user, task), start, user.id)
            if best is None or candidate < best:
                best = candidate
        if best is None:
            return _infeasible(stats)

        _, start, user_id = best
        placed[task.id] = Assignment(task_id=task.id, user_id=user_id, start_day=start)
        end_of[task.id] = start + task.effort_days
        busy[user_id].append((start, start + task.effort_days))
        del remaining[task.id]

    assignments = [placed[t.id] for t in problem.tasks]
    rule_evaluations, per_user_happiness = evaluate_rules(problem, assignments)
    objective_value = sum(h.f_j for h in per_user_happiness)
    return SolverOutput(
        status=RunStatus.FEASIBLE,
        assignments=assignments,
        objective_value=objective_value,
        per_user_happiness=per_user_happiness,
        rule_evaluations=rule_evaluations,
        solver_stats=stats,
        message=None,
    )
