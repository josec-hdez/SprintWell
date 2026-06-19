"""Compiler for the BLACKOUT_DATE rule (issue #30).

Brief §6.3 Forma B: a user cannot work on certain calendar dates
(``params = {dates}``). BLACKOUT_DATE is **always hard** and **consumes no
budget** (the ``RuleBlackoutDate`` model forces ``is_hard = True``): no task
assigned to the owner may overlap any of those days. It therefore compiles to
HARD CONSTRAINTS and contributes NO objective term — :func:`compile_blackout_date`
returns ``None`` (the registry's "pure hard constraint" signal).

Modeling — forbid coverage of each blackout day when assigned to the owner:

Each blackout date maps to a fixed sprint day index ``d = (date − start_date)``;
dates outside ``[0, duration)`` are ignored (no day to block). A task starting
on ``start[i]`` covers day ``d`` iff ``start[i] ∈ [L, U]`` with
``L = max(0, d − effort_i + 1)`` and ``U = min(d, duration − effort_i)``. For
every (task, blackout-day) pair we forbid that coverage *only when the task is
assigned to the owner*:

    assigned[i, owner] ⟹ ( start[i] ≤ L − 1  ∨  start[i] ≥ U + 1 )

modelled with two one-directional booleans (``before`` / ``after``) and a
``bool_or`` enforced only under ``assigned``. The blackout is per-owner: when
the task goes to someone else the constraint is inactive, so another user may
still take it on a blackout day.

Edge cases handled implicitly by the bounds: if the task can never cover ``d``
(``L > U``) the pair is skipped; if it can *only* cover ``d`` (neither side
feasible) the enforced ``bool_or`` is unsatisfiable, which forces
``assigned = 0`` — i.e. the owner simply cannot take that task. A disabled rule
is skipped upstream by ``compile_rule``; a blackout whose dates all fall outside
the sprint adds nothing and returns ``None``.

See:
- GitHub issue #30.
- Brief §6.3 (Forma B, BLACKOUT_DATE always hard), §7.2 R7 (hard rules).
"""

from __future__ import annotations

from typing import Any

from models import Rule, RuleBlackoutDate, RuleType
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


def _in_window_blackout_days(rule: RuleBlackoutDate, vars: BaseModelVars) -> list[int]:
    """Blackout dates mapped to in-window sprint day indices (sorted, unique)."""
    start_date = vars.problem.sprint.start_date
    duration = vars.problem.sprint.duration_days
    days = {(d - start_date).days for d in rule.params.dates}
    return sorted(day for day in days if 0 <= day < duration)


@register(RuleType.BLACKOUT_DATE)
def compile_blackout_date(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """BLACKOUT_DATE → hard-forbid the owner's tasks from overlapping the dates.

    Pure hard constraint: returns ``None`` (no objective contribution). Returns
    early when no blackout date falls inside the sprint window.
    """
    assert isinstance(rule, RuleBlackoutDate)  # dispatched by type; narrows params
    blackout_days = _in_window_blackout_days(rule, vars)
    if not blackout_days:
        return None

    duration = vars.problem.sprint.duration_days
    owner = rule.owner_id
    for task in vars.problem.tasks:
        assigned = vars.assigned[task.id, owner]
        start = vars.start[task.id]
        effort = task.effort_days
        for d in blackout_days:
            lower = max(0, d - effort + 1)
            upper = min(d, duration - effort)
            if lower > upper:
                continue  # this task can never cover day d
            before = model.new_bool_var(f"bo_before_{rule.id}_{task.id}_{d}")
            after = model.new_bool_var(f"bo_after_{rule.id}_{task.id}_{d}")
            model.add(start <= lower - 1).only_enforce_if(before)
            model.add(start >= upper + 1).only_enforce_if(after)
            # If assigned to the owner, the task must sit entirely before or
            # after the blackout day — i.e. it cannot cover it.
            model.add_bool_or([before, after]).only_enforce_if(assigned)

    return None
