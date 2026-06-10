"""CP-SAT base model builder for SprintWell (issue #18).

Builds variables and hard constraints R1-R5 (brief §7.2 / thesis §3.3) from
a validated ``ProblemInput``. Skill matching (R6) and DSL hard rules (R7)
land in later issues and are intentionally out of scope here.

References:
- brief §7.2 — R1-R5 mathematical form.
- thesis §3.3 — equations (3.1)-(3.5).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ortools.sat.python import cp_model

from models import ProblemInput

__all__ = ["BaseModelVars", "attach_trivial_objective", "build_base_model"]


@dataclass(frozen=True)
class BaseModelVars:
    """CP-SAT decision variables for the SprintWell base model.

    The dataclass is ``frozen=True`` so downstream consumers cannot mutate
    the variable dictionaries after construction. ``Any`` is used for the
    OR-Tools handles because the ``[[tool.mypy.overrides]] module =
    "ortools.*"`` configuration in ``pyproject.toml`` already returns
    ``Any`` for everything imported from ``ortools``.
    """

    assigned: dict[tuple[str, str], Any]
    """``x[i, j]`` — BoolVar, 1 iff task ``i`` is assigned to user ``j``."""

    start: dict[str, Any]
    """``s[i]`` — IntVar in ``[0, D - effort_days(i)]``."""

    end: dict[str, Any]
    """``end[i] = s[i] + effort_days(i)`` — IntVar in ``[effort_days(i), D]``."""

    interval: dict[tuple[str, str], Any]
    """OptionalIntervalVar present iff ``assigned[i, j] == 1``."""

    problem: ProblemInput
    """The validated input that produced these variables."""


def build_base_model(problem: ProblemInput) -> tuple[Any, BaseModelVars]:
    """Build the CP-SAT base model with R1-R5 hard constraints (brief §7.2).

    Variables:
    - ``start[i]`` IntVar in ``[0, D - effort_days(i)]`` — domain enforces R3.
    - ``end[i]`` IntVar in ``[effort_days(i), D]`` — derived bound.
    - ``assigned[i, j]`` BoolVar per (task, user) pair.
    - ``interval[i, j]`` OptionalIntervalVar wrapping
      ``(start[i], effort_days(i), end[i], assigned[i, j])``. When the
      presence bool is ``False`` the interval is absent and ignored by
      ``AddNoOverlap``.

    The shared ``start[i]`` / ``end[i]`` IntVars are correct because R1
    forces exactly one ``assigned[i, j]`` to be true per task, so exactly
    one of the m optional intervals for task ``i`` is present.
    """
    model = cp_model.CpModel()
    horizon = problem.sprint.duration_days

    assigned: dict[tuple[str, str], Any] = {}
    start: dict[str, Any] = {}
    end: dict[str, Any] = {}
    interval: dict[tuple[str, str], Any] = {}

    for task in problem.tasks:
        start[task.id] = model.new_int_var(0, horizon - task.effort_days, f"start_{task.id}")
        end[task.id] = model.new_int_var(task.effort_days, horizon, f"end_{task.id}")
        for user in problem.users:
            key = (task.id, user.id)
            assigned[key] = model.new_bool_var(f"x_{task.id}_{user.id}")
            interval[key] = model.new_optional_interval_var(
                start[task.id],
                task.effort_days,
                end[task.id],
                assigned[key],
                f"int_{task.id}_{user.id}",
            )

    _add_r1_uniqueness(model, problem, assigned)
    _add_r2_no_overlap(model, problem, interval)
    _add_r3_horizon(model, problem, end)
    _add_r4_deadlines(model, problem, end)
    _add_r5_dependencies(model, problem, start, end)

    return model, BaseModelVars(
        assigned=assigned,
        start=start,
        end=end,
        interval=interval,
        problem=problem,
    )


def attach_trivial_objective(model: Any, vars: BaseModelVars) -> None:
    """Attach the trivial makespan-minimization objective (issue #19).

    The base model from :func:`build_base_model` is a pure feasibility
    problem (R1-R5 hard constraints only, no objective). This function
    layers a minimal objective on top so CP-SAT returns an *optimal*
    schedule rather than any feasible one:

        minimize  makespan = max_i end[i]

    Why makespan and not a null objective:

    - Makespan is a real, defensible scheduling metric — it measures the
      day the last task finishes, i.e. sprint completion time.
    - It gives a clean swap-out point: later issues replace this with
      equity-oriented objectives (workload balance, skill match, etc.)
      without touching :func:`build_base_model`.

    Open/closed by design: :func:`build_base_model` stays factibility-only,
    and each future objective is a sibling function like this one. Callers
    that want pure feasibility simply skip the call.
    """
    horizon = vars.problem.sprint.duration_days
    makespan = model.new_int_var(0, horizon, "makespan")
    model.add_max_equality(makespan, list(vars.end.values()))
    model.minimize(makespan)


def _add_r1_uniqueness(
    model: Any,
    problem: ProblemInput,
    assigned: dict[tuple[str, str], Any],
) -> None:
    """R1 (brief §7.2 / thesis eq (3.1)): each task assigned to exactly one user."""
    for task in problem.tasks:
        model.add(sum(assigned[task.id, u.id] for u in problem.users) == 1)


def _add_r2_no_overlap(
    model: Any,
    problem: ProblemInput,
    interval: dict[tuple[str, str], Any],
) -> None:
    """R2 (brief §7.2 / thesis eq (3.2)): per-user intervals do not overlap.

    ``AddNoOverlap`` on optional intervals naturally ignores absent ones,
    so user ``j`` only sees the intervals of tasks actually assigned to
    them.
    """
    for user in problem.users:
        model.add_no_overlap([interval[task.id, user.id] for task in problem.tasks])


def _add_r3_horizon(
    model: Any,
    problem: ProblemInput,
    end: dict[str, Any],
) -> None:
    """R3 (brief §7.2 / thesis eq (3.3)): every task ends within the horizon.

    Redundant with the upper bound on ``end[i]`` but kept explicit for
    one-to-one traceability against the brief.
    """
    horizon = problem.sprint.duration_days
    for task in problem.tasks:
        model.add(end[task.id] <= horizon)


def _add_r4_deadlines(
    model: Any,
    problem: ProblemInput,
    end: dict[str, Any],
) -> None:
    """R4 (brief §7.2 / thesis eq (3.4)): respect per-task deadlines.

    Encoded as ``end[i] <= deadline_day + 1``. ``deadline_day`` is the
    last inclusive working day, and ``end[i] = start[i] + effort_days(i)``
    is the day AFTER the task finishes under CP-SAT interval semantics,
    so the ``+1`` is required.
    """
    for task in problem.tasks:
        if task.deadline_day is not None:
            model.add(end[task.id] <= task.deadline_day + 1)


def _add_r5_dependencies(
    model: Any,
    problem: ProblemInput,
    start: dict[str, Any],
    end: dict[str, Any],
) -> None:
    """R5 (brief §7.2 / thesis eq (3.5)): successor starts after each predecessor ends."""
    for task in problem.tasks:
        for predecessor_id in task.depends_on:
            model.add(end[predecessor_id] <= start[task.id])
