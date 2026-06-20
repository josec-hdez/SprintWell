"""Per-rule explainability evaluation (issue #36).

Brief §8.1 makes ``rule_evaluations`` the data source for the explainability
view (week 9): for every soft rule it reports how satisfied it is and how much
it contributes to its owner's happiness. The rule *compilers* (#26-#34)
deliberately optimise linear surrogates and defer the fractional compliance
``c_r ∈ [0, 1]`` of §7.3 to post-processing — this module is that
post-processing.

Given a solved assignment, :func:`evaluate_rules` computes, for each enabled
soft rule:

- ``satisfied`` — the fractional compliance ``c_r ∈ [0, 1]`` per the §6.3
  semantics of the rule type, read off the concrete schedule.
- ``contribution`` — ``weight · c_r`` (the rule's term in the §7.3 numerator).

and the per-user happiness ``f_j = Σ_r (w_r · c_r) / Σ_r w_r ∈ [0, 1]`` over the
user's soft rules with positive weight.

This is pure Python over the domain model (no CP-SAT), so it is independent of
how the objective was built and is exercised directly in tests. Hard rules
(``is_hard`` — e.g. BLACKOUT_DATE) are structurally enforced and carry no soft
contribution, so they are excluded.

See:
- GitHub issue #36 (depends on #35 / all compilers).
- Brief §6.3 (rule semantics), §7.3 (happiness), §8.1 (output contract).
"""

from __future__ import annotations

from collections import defaultdict
from datetime import timedelta

from models import (
    Assignment,
    ProblemInput,
    Rule,
    RuleAvoidCategory,
    RuleAvoidSkill,
    RuleAvoidWeekday,
    RuleCooldownAfter,
    RuleEvaluation,
    RuleFocusPreference,
    RuleLearnSkill,
    RuleMaxTasksPerSprint,
    RulePreferCategory,
    RulePreferDomain,
    RulePreferSkill,
    RulePreferWeekday,
    Task,
    UserHappiness,
    Weekday,
)

_WEEKDAY_TO_ISO: dict[Weekday, int] = {
    Weekday.MONDAY: 0,
    Weekday.TUESDAY: 1,
    Weekday.WEDNESDAY: 2,
    Weekday.THURSDAY: 3,
    Weekday.FRIDAY: 4,
    Weekday.SATURDAY: 5,
    Weekday.SUNDAY: 6,
}

__all__ = ["evaluate_rules"]


def _falls_on_weekday(task: Task, start_day: int, weekday_days: set[int]) -> bool:
    """Whether ``task`` (placed at ``start_day``) overlaps any weekday-W day."""
    return any(start_day <= day <= start_day + task.effort_days - 1 for day in weekday_days)


def _compliance(
    rule: Rule,
    problem: ProblemInput,
    owner_tasks: list[Task],
    start_of: dict[str, int],
) -> float:
    """Fractional compliance ``c_r ∈ [0, 1]`` of one rule on the solved schedule.

    Dispatch is by ``isinstance`` on the discriminated ``Rule`` union so each
    branch narrows ``rule.params`` to the matching type. ``owner_tasks`` are the
    tasks assigned to the rule's owner; the empty-task convention matches each
    type's intent — a "prefer" goal scores 0 when the owner has no tasks
    (nothing preferred was obtained), an "avoid" goal scores 1 (nothing bad).
    """
    n = len(owner_tasks)

    if isinstance(rule, RulePreferSkill):
        if n == 0:
            return 0.0
        return sum(1 for t in owner_tasks if rule.params.skill_id in t.required_skills) / n
    if isinstance(rule, RuleAvoidSkill):
        if n == 0:
            return 1.0
        return sum(1 for t in owner_tasks if rule.params.skill_id not in t.required_skills) / n
    if isinstance(rule, RulePreferCategory):
        if n == 0:
            return 0.0
        return sum(1 for t in owner_tasks if t.category == rule.params.category) / n
    if isinstance(rule, RuleAvoidCategory):
        if n == 0:
            return 1.0
        return sum(1 for t in owner_tasks if t.category != rule.params.category) / n
    if isinstance(rule, RulePreferDomain):
        if n == 0:
            return 0.0
        return sum(1 for t in owner_tasks if t.domain == rule.params.domain) / n
    if isinstance(rule, RulePreferWeekday):
        if n == 0:
            return 0.0
        days = _weekday_days(problem, rule.params.weekday)
        return sum(1 for t in owner_tasks if _falls_on_weekday(t, start_of[t.id], days)) / n
    if isinstance(rule, RuleAvoidWeekday):
        if n == 0:
            return 1.0
        days = _weekday_days(problem, rule.params.weekday)
        on = sum(1 for t in owner_tasks if _falls_on_weekday(t, start_of[t.id], days))
        return (n - on) / n
    if isinstance(rule, RuleMaxTasksPerSprint):
        return 1.0 if n <= rule.params.max_tasks else rule.params.max_tasks / n
    if isinstance(rule, RuleFocusPreference):
        distinct = len({t.category for t in owner_tasks})
        return 1.0 if distinct <= 1 else 1.0 / distinct
    if isinstance(rule, RuleCooldownAfter):
        return _cooldown_compliance(rule, owner_tasks, start_of)
    if isinstance(rule, RuleLearnSkill):
        count = sum(1 for t in owner_tasks if rule.params.skill_id in t.required_skills)
        return min(count, rule.params.min_tasks) / rule.params.min_tasks
    return 1.0  # pragma: no cover - BLACKOUT (hard) is filtered out before here


def _weekday_days(problem: ProblemInput, weekday: Weekday) -> set[int]:
    start_date = problem.sprint.start_date
    target = _WEEKDAY_TO_ISO[weekday]
    return {
        d
        for d in range(problem.sprint.duration_days)
        if (start_date + timedelta(days=d)).weekday() == target
    }


def _cooldown_compliance(
    rule: RuleCooldownAfter, owner_tasks: list[Task], start_of: dict[str, int]
) -> float:
    """Fraction of (trigger, other) ordered pairs that respect the cooldown."""
    after_category = rule.params.after_category
    rest_days = rule.params.rest_days
    triggers = [t for t in owner_tasks if t.category == after_category]
    pairs = [(a, b) for a in triggers for b in owner_tasks if b.id != a.id]
    if not pairs or rest_days == 0:
        return 1.0
    violations = 0
    for a, b in pairs:
        end_a = start_of[a.id] + a.effort_days
        if end_a <= start_of[b.id] <= end_a + rest_days - 1:
            violations += 1
    return 1.0 - violations / len(pairs)


def evaluate_rules(
    problem: ProblemInput, assignments: list[Assignment]
) -> tuple[list[RuleEvaluation], list[UserHappiness]]:
    """Compute per-rule evaluations and per-user happiness from a solved schedule.

    Returns ``(rule_evaluations, per_user_happiness)`` ready to drop into the
    ``SolverOutput``. Only enabled soft rules are evaluated; per-user happiness
    is reported for users that own at least one positive-weight soft rule.
    """
    start_of = {a.task_id: a.start_day for a in assignments}
    tasks_by_id = {t.id: t for t in problem.tasks}
    tasks_of_user: dict[str, list[Task]] = defaultdict(list)
    for a in assignments:
        tasks_of_user[a.user_id].append(tasks_by_id[a.task_id])

    evaluations: list[RuleEvaluation] = []
    weighted_sum: dict[str, float] = defaultdict(float)
    weight_total: dict[str, float] = defaultdict(float)

    for rule in problem.rules:
        if rule.is_hard or not rule.enabled:
            continue
        owner_tasks = tasks_of_user.get(rule.owner_id, [])
        satisfied = _compliance(rule, problem, owner_tasks, start_of)
        contribution = rule.weight * satisfied
        evaluations.append(
            RuleEvaluation(rule_id=rule.id, satisfied=satisfied, contribution=contribution)
        )
        if rule.weight > 0:
            weighted_sum[rule.owner_id] += contribution
            weight_total[rule.owner_id] += rule.weight

    happiness = [
        UserHappiness(user_id=user_id, f_j=weighted_sum[user_id] / weight_total[user_id])
        for user_id in sorted(weight_total)
        if weight_total[user_id] > 0
    ]
    return evaluations, happiness
