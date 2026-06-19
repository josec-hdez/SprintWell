"""Compiler for the MAX_TASKS_PER_SPRINT rule (issue #31).

Brief §6.3 Forma C: cap the number of tasks a user takes in the sprint
(``params = {max_tasks}``). This is the first DUAL rule — its compilation
depends on ``is_hard``:

- **Hard** (``is_hard = True``): no valid solution assigns the owner more than
  ``max_tasks`` tasks. Compiled as the hard constraint
  ``Σ_i assigned[i, owner] ≤ max_tasks`` and contributes no objective term
  (returns ``None``).
- **Soft** (``is_hard = False``): each task over the cap penalises the objective
  proportionally to the rule's weight. Compiled as the negative term
  ``− weight · excess`` where ``excess = max(0, Σ_i assigned[i, owner] − max_tasks)``.

The soft term is *negative* because the objective is maximised (other compilers
return positive rewards): full compliance ⇒ ``excess = 0`` ⇒ no penalty, and
every task over the cap subtracts ``weight``. ``excess`` is pinned exactly with
``add_max_equality`` rather than left to objective pressure, so the term is
correct no matter how the assembler (issue #35) aggregates it (utilitarian /
max-min / Nash). Per-user normalisation (§7.3) and aggregation (§7.4) remain the
assembler's job; ``rule_evaluations`` are recovered in post-processing (#36).

A rule that cannot bite returns ``None``: no tasks, the task count already
``≤ max_tasks`` (the cap is unreachable for anyone), or a soft rule with zero
budget.

See:
- GitHub issue #31.
- Brief §6.3 (Forma C), §7.2 R7 (hard rules), §7.5 (objective assembly).
"""

from __future__ import annotations

from typing import Any

from models import Rule, RuleMaxTasksPerSprint, RuleType
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


@register(RuleType.MAX_TASKS_PER_SPRINT)
def compile_max_tasks_per_sprint(
    rule: Rule, model: Any, vars: BaseModelVars
) -> ObjectiveTerm | None:
    """MAX_TASKS_PER_SPRINT → hard cap (returns ``None``) or soft excess penalty."""
    assert isinstance(rule, RuleMaxTasksPerSprint)  # dispatched by type; narrows params
    max_tasks = rule.params.max_tasks
    tasks = vars.problem.tasks
    n = len(tasks)
    # The owner can hold at most ``n`` tasks; if that is already within the cap,
    # the rule can never bite — neither a constraint nor a penalty is needed.
    if n == 0 or n <= max_tasks:
        return None

    owner = rule.owner_id
    count = sum(vars.assigned[task.id, owner] for task in tasks)

    if rule.is_hard:
        model.add(count <= max_tasks)
        return None

    if rule.weight == 0:
        return None  # soft but no budget ⇒ no penalty

    excess = model.new_int_var(0, n, f"mts_excess_{rule.id}")
    model.add_max_equality(excess, [count - max_tasks, 0])
    return -rule.weight * excess
