"""Compilers for PREFER_WEEKDAY / AVOID_WEEKDAY rules (issue #29).

Brief §6.3 Forma B: a user prefers (or avoids) working tasks that *fall on* a
given weekday. A task "falls on" a day when its occupied interval overlaps it:
``start_day ≤ day ≤ start_day + effort_days − 1``. Unlike skill/category/domain
(static task attributes), this compliance depends on *when* the task is
scheduled — i.e. on the decision variable ``start[i]``.

Modeling — reified day coverage, then a linear weighted surrogate:

The sprint days that fall on weekday ``W`` are a FIXED, precomputable set
``D_W`` (derived from ``sprint.start_date`` + ``duration_days``; not decision-
dependent). For each task we build a boolean ``falls`` that is 1 iff the task
overlaps ANY day in ``D_W``:

    falls[i] = OR_{d ∈ D_W}  ( start[i] ∈ [d − effort_i + 1, d] )

Each membership is fully reified (both directions) via two half-reified
inequality booleans ``start ≥ L`` and ``start ≤ U`` AND-ed together — full
equivalence is required because ``falls`` enters PREFER and AVOID with opposite
sign, so a half-reified bool would let the solver cheat.

The per-rule objective term is then the linear weighted surrogate used by the
other Forma-A compilers, over the indicator ``assigned[i, owner] ∧ falls`` (or
``∧ ¬falls`` for AVOID):

    PREFER_WEEKDAY:  weight · Σ_i ( assigned[i, owner] ∧  falls[i] )
    AVOID_WEEKDAY:   weight · Σ_i ( assigned[i, owner] ∧ ¬falls[i] )

Both terms are *maximised*. Per-user normalisation by Σ weights (§7.3) and
equity aggregation (§7.4) are the objective assembler's responsibility (issue
#35); the fractional ``f_j`` / ``rule_evaluations`` are recovered in
post-processing (issue #36).

Cost note: this allocates O(tasks · |D_W|) auxiliary booleans per weekday rule.
``|D_W|`` is small (weekday count over a sprint horizon of days) so it stays
cheap for realistic instances.

Scope: SOFT preference only. ``is_hard`` PREFER/AVOID_WEEKDAY is not part of the
brief's frozen hard semantics (only BLACKOUT_DATE is always hard, §6.3) and is
left to the R7 hard-rule path.

See:
- GitHub issue #29.
- Brief §6.3 (Forma B), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from models import (
    Rule,
    RuleAvoidWeekday,
    RulePreferWeekday,
    RuleType,
    Weekday,
)
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars

# Weekday name → Python ``date.weekday()`` index (Monday = 0 … Sunday = 6).
_WEEKDAY_TO_ISO: dict[Weekday, int] = {
    Weekday.MONDAY: 0,
    Weekday.TUESDAY: 1,
    Weekday.WEDNESDAY: 2,
    Weekday.THURSDAY: 3,
    Weekday.FRIDAY: 4,
    Weekday.SATURDAY: 5,
    Weekday.SUNDAY: 6,
}


def _weekday_day_indices(vars: BaseModelVars, weekday: Weekday) -> list[int]:
    """Sprint day indices (0-based) whose calendar date falls on ``weekday``."""
    start_date = vars.problem.sprint.start_date
    duration = vars.problem.sprint.duration_days
    target = _WEEKDAY_TO_ISO[weekday]
    return [d for d in range(duration) if (start_date + timedelta(days=d)).weekday() == target]


def _falls_on_weekday(
    model: Any, vars: BaseModelVars, task_id: str, effort: int, days: list[int], tag: str
) -> Any:
    """Build a fully-reified bool: 1 iff task ``task_id`` overlaps a day in ``days``."""
    start = vars.start[task_id]
    duration = vars.problem.sprint.duration_days
    covers: list[Any] = []
    for d in days:
        lower = max(0, d - effort + 1)
        upper = min(d, duration - effort)
        if lower > upper:
            continue  # no valid start lets this task cover day d
        ge = model.new_bool_var(f"wd_ge_{tag}_{task_id}_{d}")
        model.add(start >= lower).only_enforce_if(ge)
        model.add(start <= lower - 1).only_enforce_if(~ge)
        le = model.new_bool_var(f"wd_le_{tag}_{task_id}_{d}")
        model.add(start <= upper).only_enforce_if(le)
        model.add(start >= upper + 1).only_enforce_if(~le)
        cover = model.new_bool_var(f"wd_cover_{tag}_{task_id}_{d}")
        model.add_bool_and([ge, le]).only_enforce_if(cover)
        model.add_bool_or([~ge, ~le, cover])
        covers.append(cover)

    falls = model.new_bool_var(f"wd_falls_{tag}_{task_id}")
    if covers:
        model.add_max_equality(falls, covers)  # OR over the per-day covers
    else:
        model.add(falls == 0)
    return falls


def _weekday_term(
    rule: Rule, model: Any, vars: BaseModelVars, *, weekday: Weekday, prefer: bool
) -> ObjectiveTerm | None:
    """Shared body: weighted Σ over tasks of ``assigned ∧ (falls xor ¬prefer)``."""
    days = _weekday_day_indices(vars, weekday)
    tasks = vars.problem.tasks
    # No weekday-W day in the sprint ⇒ PREFER unsatisfiable / AVOID vacuously
    # satisfied: either way there is no decision pressure, so contribute nothing.
    if not days or not tasks or rule.weight == 0:
        return None

    owner = rule.owner_id
    indicators: list[Any] = []
    for task in tasks:
        falls = _falls_on_weekday(model, vars, task.id, task.effort_days, days, rule.id)
        assigned = vars.assigned[task.id, owner]
        target = falls if prefer else ~falls
        kind = "pref" if prefer else "avoid"
        indicator = model.new_bool_var(f"wd_{kind}_{rule.id}_{task.id}")
        # indicator ⟺ assigned ∧ target
        model.add_bool_and([assigned, target]).only_enforce_if(indicator)
        model.add_bool_or([~assigned, ~target, indicator])
        indicators.append(indicator)

    return rule.weight * sum(indicators)


@register(RuleType.PREFER_WEEKDAY)
def compile_prefer_weekday(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """PREFER_WEEKDAY → reward tasks assigned to the owner that fall on the weekday."""
    assert isinstance(rule, RulePreferWeekday)  # dispatched by type; narrows params
    return _weekday_term(rule, model, vars, weekday=rule.params.weekday, prefer=True)


@register(RuleType.AVOID_WEEKDAY)
def compile_avoid_weekday(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """AVOID_WEEKDAY → reward tasks assigned to the owner that avoid the weekday."""
    assert isinstance(rule, RuleAvoidWeekday)  # dispatched by type; narrows params
    return _weekday_term(rule, model, vars, weekday=rule.params.weekday, prefer=False)
