"""Compiler for the PREFER_DOMAIN rule (issue #28).

Brief §6.3 Forma A: a user prefers tasks of a given functional domain
(``params = {domain}``, e.g. "auth", "billing"). Unlike skills and categories,
``domain`` is a free-form string and the brief defines no AVOID_DOMAIN variant —
only the positive preference exists.

This module compiles PREFER_DOMAIN into a weighted, linear objective term
feeding the soft objective (§7.5), following the same modeling decision as the
PREFER_SKILL / PREFER_CATEGORY compilers: per-rule compliance (§7.3, the
*fraction* of the user's tasks in the domain) is represented by a LINEAR
weighted surrogate rather than an exact decision-dependent division, which §7.5
sanctions and which keeps the model fast and well-defined. The fractional
``f_j`` / ``rule_evaluations`` are recovered in post-processing (issue #36).

The compiler returns a LINEAR term, monotone in the number — hence the
fraction, for a fixed task pool — of domain-matching tasks assigned to the
owner ``j``:

    PREFER_DOMAIN:  weight · Σ_{i ∈ M} assigned[i, j]

where ``M`` is the set of tasks whose ``domain`` equals the rule's ``domain``.
The term is *maximised* (higher = more compliant). Per-user normalisation by
Σ weights (§7.3) and equity aggregation (§7.4) are the objective assembler's
responsibility (issue #35), not this compiler's.

Scope: this compiles the SOFT preference. ``is_hard`` PREFER_DOMAIN is not part
of the brief's frozen hard semantics (only BLACKOUT_DATE is always hard, §6.3)
and is left to the R7 hard-rule path.

See:
- GitHub issue #28.
- Brief §6.3 (Forma A), §7.3 (fractional compliance), §7.5 (objective assembly).
"""

from __future__ import annotations

from typing import Any

from models import Rule, RulePreferDomain, RuleType
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


def _matching_task_ids(vars: BaseModelVars, domain: str) -> list[str]:
    """Ids of tasks whose ``domain`` equals ``domain`` (in order)."""
    return [task.id for task in vars.problem.tasks if task.domain == domain]


@register(RuleType.PREFER_DOMAIN)
def compile_prefer_domain(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """PREFER_DOMAIN → reward assigning domain-matching tasks to the owner.

    Returns ``weight · Σ_{i ∈ M} assigned[i, owner]`` (to maximise), or ``None``
    when there is nothing to reward — no task in the domain, or zero budget.
    """
    assert isinstance(rule, RulePreferDomain)  # dispatched by type; narrows params
    matching = _matching_task_ids(vars, rule.params.domain)
    if not matching or rule.weight == 0:
        return None
    matched_assignments = sum(vars.assigned[task_id, rule.owner_id] for task_id in matching)
    return rule.weight * matched_assignments
