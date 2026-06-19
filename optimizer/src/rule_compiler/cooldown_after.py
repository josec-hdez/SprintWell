"""Compiler for the COOLDOWN_AFTER rule (issue #33).

Brief §6.3 Forma D (sequence/relation): after a task of a given category, the
user wants ``rest_days`` days with no new task starting
(``params = {after_category, rest_days}``; canonical: ``on_call`` + 1). This is
the only rule that relates *pairs* of the owner's tasks through their timing.

Modeling — per ordered pair of the owner's tasks:

For every trigger task ``A`` (category ``after_category``) and every other task
``B``, ``B`` lands in ``A``'s cooldown window when, with both assigned to the
owner, ``B`` starts within ``rest_days`` of ``A`` finishing:

    end[A] ≤ start[B] ≤ end[A] + rest_days − 1

(``end[A] = start[A] + effort_A`` is the day after ``A``'s last working day, so
the window is the ``rest_days`` days immediately following ``A``.) The owner's
tasks never overlap (R2), so a ``B`` starting before ``end[A]`` is genuinely
*before* ``A`` and is unaffected.

- **Hard** (``is_hard = True``): forbid the window. For each pair,
  ``(assigned[A] ∧ assigned[B]) ⟹ ( start[B] ≤ end[A] − 1 ∨ start[B] ≥ end[A] + rest_days )``
  enforced with a two-literal guard. Returns ``None`` (no objective term).
- **Soft** (``is_hard = False``): penalise each violation. A fully-reified
  boolean ``viol = assigned[A] ∧ assigned[B] ∧ (start[B] in window)`` is built
  per pair and the term is ``− weight · Σ viol``. Full reification is required
  because ``viol`` enters a maximised objective — a half-reified bool would let
  the solver dodge the penalty while still violating.

A rule that cannot bite returns ``None``: ``rest_days == 0`` (empty window), no
task of ``after_category``, or a soft rule with zero budget. Per-user
normalisation (§7.3) / ``rule_evaluations`` (#36) live downstream.

See:
- GitHub issue #33.
- Brief §6.3 (Forma D), §7.2 R7 (hard rules), §7.5 (objective assembly).
"""

from __future__ import annotations

from typing import Any

from models import Rule, RuleCooldownAfter, RuleType, Task
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


def _add_hard_pair(
    model: Any, vars: BaseModelVars, a: Task, b: Task, owner: str, rest_days: int, tag: str
) -> None:
    """Forbid B from starting in A's cooldown window when both go to the owner."""
    end_a = vars.end[a.id]
    start_b = vars.start[b.id]
    assigned_a = vars.assigned[a.id, owner]
    assigned_b = vars.assigned[b.id, owner]
    before = model.new_bool_var(f"cd_before_{tag}_{a.id}_{b.id}")
    after = model.new_bool_var(f"cd_after_{tag}_{a.id}_{b.id}")
    model.add(start_b <= end_a - 1).only_enforce_if(before)
    model.add(start_b >= end_a + rest_days).only_enforce_if(after)
    # If both are the owner's, B must be entirely before A or past the cooldown.
    model.add_bool_or([before, after]).only_enforce_if([assigned_a, assigned_b])


def _soft_pair_violation(
    model: Any, vars: BaseModelVars, a: Task, b: Task, owner: str, rest_days: int, tag: str
) -> Any:
    """Fully-reified bool: 1 iff B starts in A's cooldown window, both on owner."""
    end_a = vars.end[a.id]
    start_b = vars.start[b.id]
    assigned_a = vars.assigned[a.id, owner]
    assigned_b = vars.assigned[b.id, owner]

    ge = model.new_bool_var(f"cd_ge_{tag}_{a.id}_{b.id}")  # start_b >= end_a
    model.add(start_b >= end_a).only_enforce_if(ge)
    model.add(start_b <= end_a - 1).only_enforce_if(~ge)
    le = model.new_bool_var(f"cd_le_{tag}_{a.id}_{b.id}")  # start_b <= end_a + rest_days - 1
    model.add(start_b <= end_a + rest_days - 1).only_enforce_if(le)
    model.add(start_b >= end_a + rest_days).only_enforce_if(~le)
    in_window = model.new_bool_var(f"cd_win_{tag}_{a.id}_{b.id}")
    model.add_bool_and([ge, le]).only_enforce_if(in_window)
    model.add_bool_or([~ge, ~le, in_window])

    viol = model.new_bool_var(f"cd_viol_{tag}_{a.id}_{b.id}")
    model.add_bool_and([assigned_a, assigned_b, in_window]).only_enforce_if(viol)
    model.add_bool_or([~assigned_a, ~assigned_b, ~in_window, viol])
    return viol


@register(RuleType.COOLDOWN_AFTER)
def compile_cooldown_after(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """COOLDOWN_AFTER → hard-forbid (None) or soft-penalise the cooldown window."""
    assert isinstance(rule, RuleCooldownAfter)  # dispatched by type; narrows params
    rest_days = rule.params.rest_days
    tasks = vars.problem.tasks
    triggers = [t for t in tasks if t.category == rule.params.after_category]
    # rest_days == 0 ⇒ empty window; no trigger task ⇒ nothing to cool down after.
    if rest_days == 0 or not triggers:
        return None

    owner = rule.owner_id
    pairs = [(a, b) for a in triggers for b in tasks if b.id != a.id]

    if rule.is_hard:
        for a, b in pairs:
            _add_hard_pair(model, vars, a, b, owner, rest_days, rule.id)
        return None

    if rule.weight == 0:
        return None  # soft but no budget ⇒ no penalty

    violations = [
        _soft_pair_violation(model, vars, a, b, owner, rest_days, rule.id) for a, b in pairs
    ]
    return -rule.weight * sum(violations)
