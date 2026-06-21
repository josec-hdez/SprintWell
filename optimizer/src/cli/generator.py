"""``sprintwell-gen`` — synthetic instance generator CLI (issue #40).

Brief §3 freezes the project to synthetic data, so the whole validation rests on
reproducible generated instances. This CLI emits a schema-valid ``ProblemInput``
JSON parametrised exactly as brief §9 specifies::

    sprintwell-gen --users 15 --tasks 80 --days 10 --skills 12 \\
        --rule-density 0.6 --conflict-density 0.1 --seed 42 --out instance.json

The same ``--seed`` always yields the same instance (a single seeded RNG drives
every draw, in a fixed order). ``--out`` defaults to stdout (``-``). The output
is constructed through the ``ProblemInput`` model, so it is validated by
construction.

See:
- GitHub issue #40.
- Brief §9 (generator parameters), §5-§6 (domain + rule shapes).
"""

from __future__ import annotations

import argparse
import random
import sys
from datetime import date, timedelta
from pathlib import Path

from pydantic import ValidationError

from models import (
    AvoidCategoryParams,
    AvoidSkillParams,
    AvoidWeekdayParams,
    BlackoutDateParams,
    CooldownAfterParams,
    EquityMode,
    FocusPreferenceParams,
    LearnSkillParams,
    MaxTasksPerSprintParams,
    PreferCategoryParams,
    PreferDomainParams,
    PreferSkillParams,
    PreferWeekdayParams,
    ProblemInput,
    Rule,
    RuleAvoidCategory,
    RuleAvoidSkill,
    RuleAvoidWeekday,
    RuleBlackoutDate,
    RuleCooldownAfter,
    RuleFocusPreference,
    RuleLearnSkill,
    RuleMaxTasksPerSprint,
    RulePreferCategory,
    RulePreferDomain,
    RulePreferSkill,
    RulePreferWeekday,
    Skill,
    Sprint,
    Task,
    TaskCategory,
    User,
    UserSkill,
    Weekday,
)

EXIT_OK = 0
EXIT_BAD_ARGS = 2

_START_DATE = date(2026, 5, 4)  # a Monday — keeps weekday rules legible
_DOMAINS = ("auth", "billing", "payments", "infra", "data")
_RULE_SLOTS = 4  # per-user Bernoulli trials; expected rules ≈ rule_density · 4

_EQUITY_MODES = {
    "utilitarian": EquityMode.UTILITARIAN,
    "max-min": EquityMode.MAX_MIN,
    "nash": EquityMode.NASH,
}


def _make_rule(  # noqa: C901
    rng: random.Random,
    rule_id: str,
    owner_id: str,
    skill_ids: list[str],
    categories: list[TaskCategory],
    days: int,
    max_tasks: int,
) -> Rule:
    """Build one random rule for ``owner_id`` (skill rules gated on a catalog)."""
    kinds = [
        "prefer_category",
        "avoid_category",
        "prefer_domain",
        "prefer_weekday",
        "avoid_weekday",
        "max_tasks",
        "focus",
        "cooldown",
        "blackout",
    ]
    if skill_ids:
        kinds += ["prefer_skill", "avoid_skill", "learn_skill"]
    kind = rng.choice(kinds)
    weight = rng.randint(10, 60)

    if kind == "prefer_skill":
        return RulePreferSkill(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=PreferSkillParams(skill_id=rng.choice(skill_ids)),
        )
    if kind == "avoid_skill":
        return RuleAvoidSkill(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=AvoidSkillParams(skill_id=rng.choice(skill_ids)),
        )
    if kind == "learn_skill":
        return RuleLearnSkill(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=LearnSkillParams(skill_id=rng.choice(skill_ids), min_tasks=rng.randint(1, 3)),
        )
    if kind == "prefer_category":
        return RulePreferCategory(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=PreferCategoryParams(category=rng.choice(categories)),
        )
    if kind == "avoid_category":
        return RuleAvoidCategory(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=AvoidCategoryParams(category=rng.choice(categories)),
        )
    if kind == "prefer_domain":
        return RulePreferDomain(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=PreferDomainParams(domain=rng.choice(_DOMAINS)),
        )
    if kind == "prefer_weekday":
        return RulePreferWeekday(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=PreferWeekdayParams(weekday=rng.choice(list(Weekday))),
        )
    if kind == "avoid_weekday":
        return RuleAvoidWeekday(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=AvoidWeekdayParams(weekday=rng.choice(list(Weekday))),
        )
    if kind == "max_tasks":
        return RuleMaxTasksPerSprint(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=MaxTasksPerSprintParams(max_tasks=rng.randint(1, max(1, max_tasks))),
        )
    if kind == "focus":
        return RuleFocusPreference(
            id=rule_id, owner_id=owner_id, weight=weight, params=FocusPreferenceParams()
        )
    if kind == "cooldown":
        return RuleCooldownAfter(
            id=rule_id,
            owner_id=owner_id,
            weight=weight,
            params=CooldownAfterParams(
                after_category=rng.choice(categories), rest_days=rng.randint(0, max(0, days - 1))
            ),
        )
    # blackout — always hard, dates within the sprint window.
    offset = rng.randint(0, max(0, days - 1))
    return RuleBlackoutDate(
        id=rule_id,
        owner_id=owner_id,
        is_hard=True,
        params=BlackoutDateParams(dates=[_START_DATE + timedelta(days=offset)]),
    )


def generate_instance(
    *,
    users: int,
    tasks: int,
    days: int,
    skills: int,
    rule_density: float,
    conflict_density: float,
    seed: int,
    equity_mode: EquityMode = EquityMode.UTILITARIAN,
) -> ProblemInput:
    """Generate a reproducible, schema-valid ``ProblemInput`` (brief §9)."""
    rng = random.Random(seed)
    categories = list(TaskCategory)

    skill_ids = [f"skill_{i}" for i in range(skills)]
    catalog = [Skill(id=sid, name=sid.replace("_", " ").title()) for sid in skill_ids]

    user_list: list[User] = []
    for i in range(users):
        n_sk = rng.randint(0, min(len(skill_ids), 4))
        chosen = rng.sample(skill_ids, n_sk) if skill_ids else []
        user_list.append(
            User(
                id=f"u{i}",
                name=f"User {i}",
                skills=[UserSkill(skill_id=sid, level=rng.randint(1, 5)) for sid in chosen],
            )
        )

    task_list: list[Task] = []
    for j in range(tasks):
        effort = rng.randint(1, min(3, days))
        n_req = rng.randint(0, min(len(skill_ids), 2))
        deadline = rng.randint(effort - 1, days - 1) if rng.random() < 0.3 else None
        depends_on = [f"t{rng.randint(0, j - 1)}"] if j > 0 and rng.random() < 0.2 else []
        task_list.append(
            Task(
                id=f"t{j}",
                name=f"Task {j}",
                effort_days=effort,
                required_skills=rng.sample(skill_ids, n_req) if skill_ids else [],
                category=rng.choice(categories),
                domain=rng.choice(_DOMAINS),
                deadline_day=deadline,
                depends_on=depends_on,
            )
        )

    rules: list[Rule] = []
    for user in user_list:
        for slot in range(_RULE_SLOTS):
            if rng.random() < rule_density:
                rules.append(
                    _make_rule(
                        rng, f"r_{user.id}_{slot}", user.id, skill_ids, categories, days, tasks
                    )
                )
        if rng.random() < conflict_density:
            # Antagonistic pair on the same category to stress the solver (§6.4).
            category = rng.choice(categories)
            rules.append(
                RulePreferCategory(
                    id=f"r_{user.id}_cp",
                    owner_id=user.id,
                    weight=50,
                    params=PreferCategoryParams(category=category),
                )
            )
            rules.append(
                RuleAvoidCategory(
                    id=f"r_{user.id}_ca",
                    owner_id=user.id,
                    weight=50,
                    params=AvoidCategoryParams(category=category),
                )
            )

    return ProblemInput(
        sprint=Sprint(
            id="sprint_gen", name="Generated sprint", start_date=_START_DATE, duration_days=days
        ),
        users=user_list,
        tasks=task_list,
        skills=catalog,
        rules=rules,
        equity_mode=equity_mode,
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sprintwell-gen",
        description="Generate a synthetic ProblemInput JSON instance (brief §9).",
    )
    parser.add_argument("--users", type=int, default=15, help="Number of users (≥ 1).")
    parser.add_argument("--tasks", type=int, default=80, help="Number of tasks (≥ 0).")
    parser.add_argument("--days", type=int, default=10, help="Sprint duration in days (≥ 1).")
    parser.add_argument("--skills", type=int, default=12, help="Skill catalog size (≥ 0).")
    parser.add_argument("--rule-density", type=float, default=0.6, help="Rules per user, 0-1.")
    parser.add_argument("--conflict-density", type=float, default=0.1, help="Conflict prob, 0-1.")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed for reproducibility.")
    parser.add_argument(
        "--equity-mode",
        type=str,
        choices=sorted(_EQUITY_MODES),
        default="utilitarian",
        help="Equity aggregation mode recorded on the instance.",
    )
    parser.add_argument("--out", type=str, default="-", help="Output path ('-' writes to stdout).")
    return parser


def _validate_args(args: argparse.Namespace) -> str | None:
    """Return an error message if the parameters are out of range, else ``None``."""
    if args.users < 1:
        return "--users must be ≥ 1"
    if args.tasks < 0:
        return "--tasks must be ≥ 0"
    if args.days < 1:
        return "--days must be ≥ 1"
    if args.skills < 0:
        return "--skills must be ≥ 0"
    if not 0.0 <= args.rule_density <= 1.0:
        return "--rule-density must be in [0, 1]"
    if not 0.0 <= args.conflict_density <= 1.0:
        return "--conflict-density must be in [0, 1]"
    return None


def main(argv: list[str] | None = None) -> int:
    """CLI entry point. Returns an exit code (no ``SystemExit`` raised here)."""
    args = _build_parser().parse_args(argv)
    error = _validate_args(args)
    if error is not None:
        print(f"error: {error}", file=sys.stderr)
        return EXIT_BAD_ARGS

    try:
        instance = generate_instance(
            users=args.users,
            tasks=args.tasks,
            days=args.days,
            skills=args.skills,
            rule_density=args.rule_density,
            conflict_density=args.conflict_density,
            seed=args.seed,
            equity_mode=_EQUITY_MODES[args.equity_mode],
        )
    except ValidationError as exc:  # pragma: no cover - defensive; generation stays valid
        print(f"error: generated an invalid instance: {exc}", file=sys.stderr)
        return EXIT_BAD_ARGS

    payload = instance.model_dump_json(indent=2)
    if args.out == "-":
        sys.stdout.write(payload + "\n")
    else:
        Path(args.out).write_text(payload + "\n", encoding="utf-8")
    return EXIT_OK
