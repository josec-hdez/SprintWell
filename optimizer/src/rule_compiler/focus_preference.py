"""Compiler for the FOCUS_PREFERENCE rule (issue #32).

Brief §6.3 Forma C: a user prefers to concentrate on FEW distinct task
categories within the sprint (``params = {}``). The objective contribution is
*inverse* to the number of distinct categories the user works.

Modeling — count distinct categories, penalise the spread:

For each category ``c`` present in the task pool, ``cat_used[c]`` is a boolean
that is 1 iff the owner is assigned at least one task of category ``c``
(``cat_used[c] = OR_i assigned[i, owner]`` over tasks of category ``c``, pinned
with ``add_max_equality``). The owner's distinct-category count is
``distinct = Σ_c cat_used[c]``. The soft term is:

    − weight · max(0, distinct − 1)

The ``− 1`` baseline matters: penalising ``distinct`` directly would also reward
giving the owner *no* tasks at all (``distinct = 0``), a perverse incentive that
starves the user instead of focusing them. With ``max(0, distinct − 1)`` both
"no work" (``distinct = 0``) and "fully focused" (``distinct = 1``) score 0
penalty, so only spreading across MORE than one category is penalised — and the
penalty grows with each extra category, i.e. the contribution decreases as the
distinct-category count rises. The term is negative because the objective is
maximised (other compilers return positive rewards). ``excess`` is pinned with
``add_max_equality`` so it is correct regardless of how the assembler (#35)
aggregates; per-user normalisation (§7.3) and ``rule_evaluations`` (#36) live
downstream.

A rule that cannot bite returns ``None``: no tasks, the pool has at most one
category (the owner can never spread), or zero budget.

See:
- GitHub issue #32.
- Brief §6.3 (Forma C), §7.5 (objective assembly).
"""

from __future__ import annotations

from typing import Any

from models import Rule, RuleFocusPreference, RuleType
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


@register(RuleType.FOCUS_PREFERENCE)
def compile_focus_preference(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """FOCUS_PREFERENCE → penalise each distinct category beyond the first."""
    assert isinstance(rule, RuleFocusPreference)  # dispatched by type
    tasks = vars.problem.tasks
    categories = sorted({task.category for task in tasks}, key=lambda c: c.value)
    # With ≤ 1 category in the pool the owner can never spread across categories,
    # so the rule can never bite.
    if not tasks or len(categories) <= 1 or rule.weight == 0:
        return None

    owner = rule.owner_id
    cat_used: list[Any] = []
    for category in categories:
        member_assignments = [
            vars.assigned[task.id, owner] for task in tasks if task.category == category
        ]
        used = model.new_bool_var(f"focus_used_{rule.id}_{category.value}")
        model.add_max_equality(used, member_assignments)  # used == OR of the members
        cat_used.append(used)

    distinct = sum(cat_used)
    extra = model.new_int_var(0, len(categories), f"focus_extra_{rule.id}")
    model.add_max_equality(extra, [distinct - 1, 0])
    return -rule.weight * extra
