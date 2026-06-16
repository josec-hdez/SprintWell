"""Compilers for PREFER_CATEGORY / AVOID_CATEGORY rules (issue #27).

Brief §6.3 Forma A: a user prefers (or avoids) tasks of a given category
(``params = {category}``, one of feature/bug/infra/sre/on_call/docs/research).
This module compiles both rule types into a weighted, linear objective term
feeding the soft objective (§7.5).

It follows the same modeling decision as the PREFER_SKILL / AVOID_SKILL
compiler: per-rule compliance (§7.3, the *fraction* of the user's tasks in the
category) is represented by a LINEAR weighted surrogate rather than an exact
decision-dependent division, which §7.5 sanctions and which keeps the model
fast and well-defined. The fractional ``f_j`` / ``rule_evaluations`` are
recovered in post-processing from the chosen solution (issue #36).

Each compiler returns a LINEAR term, monotone in the number — hence the
fraction, for a fixed task pool — of category-matching tasks assigned to the
owner ``j``:

    PREFER_CATEGORY:  weight · Σ_{i ∈ M}  assigned[i, j]
    AVOID_CATEGORY:   weight · Σ_{i ∈ M} (1 − assigned[i, j])

where ``M`` is the set of tasks whose ``category`` equals the rule's
``category``. Both terms are *maximised* (higher = more compliant). Per-user
normalisation by Σ weights (§7.3) and equity aggregation (§7.4) are the
objective assembler's responsibility (issue #35), not this compiler's.

Scope: this compiles the SOFT preference. ``is_hard`` PREFER/AVOID_CATEGORY is
not part of the brief's frozen hard semantics (only BLACKOUT_DATE is always
hard, §6.3) and is left to the R7 hard-rule path.

See:
- GitHub issue #27.
- Brief §6.3 (Forma A), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from typing import Any

from models import (
    Rule,
    RuleAvoidCategory,
    RulePreferCategory,
    RuleType,
    TaskCategory,
)
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


def _matching_task_ids(vars: BaseModelVars, category: TaskCategory) -> list[str]:
    """Ids of tasks whose ``category`` equals ``category`` (in order)."""
    return [task.id for task in vars.problem.tasks if task.category == category]


@register(RuleType.PREFER_CATEGORY)
def compile_prefer_category(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """PREFER_CATEGORY → reward assigning category-matching tasks to the owner.

    Returns ``weight · Σ_{i ∈ M} assigned[i, owner]`` (to maximise), or ``None``
    when there is nothing to reward — no task in the category, or zero budget.
    """
    assert isinstance(rule, RulePreferCategory)  # dispatched by type; narrows params
    matching = _matching_task_ids(vars, rule.params.category)
    if not matching or rule.weight == 0:
        return None
    matched_assignments = sum(vars.assigned[task_id, rule.owner_id] for task_id in matching)
    return rule.weight * matched_assignments


@register(RuleType.AVOID_CATEGORY)
def compile_avoid_category(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """AVOID_CATEGORY → reward keeping category-matching tasks off the owner.

    Returns ``weight · Σ_{i ∈ M} (1 − assigned[i, owner])`` (to maximise), or
    ``None`` when no task is in the category or the rule carries zero budget.
    With no matching task the preference is vacuously satisfied and adds no
    decision pressure, so contributing no term is correct.
    """
    assert isinstance(rule, RuleAvoidCategory)  # dispatched by type; narrows params
    matching = _matching_task_ids(vars, rule.params.category)
    if not matching or rule.weight == 0:
        return None
    avoided = sum(1 - vars.assigned[task_id, rule.owner_id] for task_id in matching)
    return rule.weight * avoided
