"""Compilers for PREFER_SKILL / AVOID_SKILL rules (issue #26).

Brief §6.3 Forma A: a user prefers (or avoids) tasks that require a given
skill (``params = {skill_id}``). This module compiles both rule types into a
weighted, linear objective term feeding the soft objective (§7.5).

Modeling decision — linear weighted count, not an exact fraction:

§7.3 describes per-rule compliance ``c ∈ [0, 1]`` as the *fraction* of the
user's tasks that require the skill ("80% of my tasks are Python → c = 0.8").
Encoding that fraction literally in CP-SAT means dividing two decision-
dependent sums (matching tasks / total tasks of the user) — a variable-
denominator integer division that (a) blows up solve time and (b) is undefined
when the user gets zero tasks. §7.5 explicitly sanctions the cleaner route:
"maximize a weighted sum of compliances" via linear surrogate terms, with the
fractional ``f_j`` / ``rule_evaluations`` recovered in post-processing from the
chosen solution (issue #36), not used as the literal CP-SAT objective.

So each compiler returns a LINEAR term, monotone in the number — hence the
fraction, for a fixed task pool — of skill-matching tasks assigned to the
owner ``j``:

    PREFER_SKILL:  weight · Σ_{i ∈ M}  assigned[i, j]
    AVOID_SKILL:   weight · Σ_{i ∈ M} (1 − assigned[i, j])

where ``M`` is the set of tasks whose ``required_skills`` contains the rule's
``skill_id``. Both terms are *maximised* (higher = more compliant). Per-user
normalisation by Σ weights (§7.3) and equity aggregation (§7.4) are the
objective assembler's responsibility (issue #35), not this compiler's.

Scope: this compiles the SOFT preference. ``is_hard`` PREFER/AVOID_SKILL is not
part of the brief's frozen hard semantics (only BLACKOUT_DATE is always hard,
§6.3) and is left to the R7 hard-rule path.

See:
- GitHub issue #26.
- Brief §6.3 (Forma A), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from typing import Any

from models import Rule, RuleAvoidSkill, RulePreferSkill, RuleType
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


def _matching_task_ids(vars: BaseModelVars, skill_id: str) -> list[str]:
    """Ids of tasks whose ``required_skills`` contains ``skill_id`` (in order)."""
    return [task.id for task in vars.problem.tasks if skill_id in task.required_skills]


@register(RuleType.PREFER_SKILL)
def compile_prefer_skill(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """PREFER_SKILL → reward assigning skill-matching tasks to the owner.

    Returns ``weight · Σ_{i ∈ M} assigned[i, owner]`` (to maximise), or ``None``
    when there is nothing to reward — no task requires the skill, or the rule
    carries zero budget.
    """
    assert isinstance(rule, RulePreferSkill)  # dispatched by type; narrows params
    matching = _matching_task_ids(vars, rule.params.skill_id)
    if not matching or rule.weight == 0:
        return None
    matched_assignments = sum(vars.assigned[task_id, rule.owner_id] for task_id in matching)
    return rule.weight * matched_assignments


@register(RuleType.AVOID_SKILL)
def compile_avoid_skill(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """AVOID_SKILL → reward keeping skill-matching tasks off the owner.

    Returns ``weight · Σ_{i ∈ M} (1 − assigned[i, owner])`` (to maximise), or
    ``None`` when no task requires the skill or the rule carries zero budget.
    With no matching task the preference is vacuously satisfied and adds no
    decision pressure, so contributing no term is correct.
    """
    assert isinstance(rule, RuleAvoidSkill)  # dispatched by type; narrows params
    matching = _matching_task_ids(vars, rule.params.skill_id)
    if not matching or rule.weight == 0:
        return None
    avoided = sum(1 - vars.assigned[task_id, rule.owner_id] for task_id in matching)
    return rule.weight * avoided
