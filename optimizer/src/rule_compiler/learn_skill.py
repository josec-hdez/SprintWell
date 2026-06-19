"""Compiler for the LEARN_SKILL rule (issue #34).

Brief §6.3 Forma E (growth): a user wants AT LEAST ``min_tasks`` tasks that
require a given skill, **even without having that skill**
(``params = {skill_id, min_tasks}``). It deliberately inverts the skill-match
heuristic and **relaxes R6** (the minimum-skill filter, issue #21) for the
owner/skill pairs it names.

Two responsibilities, two seams:

1. **R6 relaxation (build time).** R6 is a *pre-filter*: ``build_base_model``
   asserts ``assigned[i, j] == 0`` for statically ineligible pairs, and CP-SAT
   has no way to remove a constraint after the fact. So the relaxation cannot
   be done by the compiler (which runs *after* the model is built) — it must be
   known when the model is constructed. :func:`learning_skills_per_user` derives
   the ``Λ_j`` map (``{owner_id: {skill_id, ...}}``) from the rule set; the
   orchestration layer (issue #35) passes it to
   ``build_base_model(problem, learning_skills_per_user=...)`` so R6 is relaxed
   for exactly those pairs. ``cpsat._add_r6_skill_filter`` already consumes this
   map (it skips the eligibility check when ``skill_id ∈ Λ_j``).

2. **Reward (objective).** :func:`compile_learn_skill` returns the soft term
   rewarding progress toward the goal:

       weight · min( Σ_{i ∈ M} assigned[i, owner],  min_tasks )

   where ``M`` is the set of tasks requiring the skill. The ``min(…, min_tasks)``
   cap encodes "at least ``min_tasks``": progress is rewarded up to the goal and
   extra tasks add nothing. The term is maximised. Per-user normalisation (§7.3)
   and aggregation (§7.4) are the assembler's job (#35); ``rule_evaluations``
   are recovered in post-processing (#36).

A rule contributes no reward term (``None``) when no task requires the skill or
the rule has zero budget. Disabled rules are skipped by ``compile_rule`` and by
:func:`learning_skills_per_user` (so a disabled LEARN_SKILL neither relaxes R6
nor rewards).

See:
- GitHub issue #34 (depends on issue #21's R6 hook).
- Brief §6.3 (Forma E), §7.2 R6, §7.5 (objective assembly).
"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from models import Rule, RuleLearnSkill, RuleType
from rule_compiler import ObjectiveTerm, register
from solvers.cpsat import BaseModelVars


def learning_skills_per_user(rules: Iterable[Rule]) -> dict[str, frozenset[str]]:
    """Derive the R6-relaxation map ``Λ_j`` from the rule set.

    Maps each owner to the frozenset of skill ids they are actively
    LEARN_SKILL-ing (enabled rules only). Pass the result to
    ``build_base_model(problem, learning_skills_per_user=...)`` so R6 is relaxed
    for those (owner, skill) pairs. Owners with no LEARN_SKILL rule are absent
    from the map (≡ no relaxation).
    """
    accumulator: dict[str, set[str]] = {}
    for rule in rules:
        if isinstance(rule, RuleLearnSkill) and rule.enabled:
            accumulator.setdefault(rule.owner_id, set()).add(rule.params.skill_id)
    return {owner: frozenset(skills) for owner, skills in accumulator.items()}


@register(RuleType.LEARN_SKILL)
def compile_learn_skill(rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None:
    """LEARN_SKILL → reward the owner reaching ``min_tasks`` skill-requiring tasks."""
    assert isinstance(rule, RuleLearnSkill)  # dispatched by type; narrows params
    matching = [
        task.id for task in vars.problem.tasks if rule.params.skill_id in task.required_skills
    ]
    if not matching or rule.weight == 0:
        return None

    count = sum(vars.assigned[task_id, rule.owner_id] for task_id in matching)
    # achieved = min(count, min_tasks): progress is rewarded up to the goal,
    # extra tasks beyond min_tasks add nothing ("at least min_tasks").
    achieved = model.new_int_var(0, rule.params.min_tasks, f"learn_achieved_{rule.id}")
    model.add_min_equality(achieved, [count, rule.params.min_tasks])
    return rule.weight * achieved
