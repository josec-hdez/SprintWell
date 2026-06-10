"""Pydantic v2 contract models for the SprintWell solver microservice.

This module is the source of truth for the JSON payload exchanged between the
NestJS backend (Zod) and the optimizer microservice (Pydantic). The backend
mirrors these shapes; any drift must be reconciled here first.

Brief references:
- Per brief §3 — code and identifiers in English.
- Per brief §5 — domain entities (Sprint, Task, User, Skill, Assignment).
- Per brief §6.1 — rule envelope: ``{id, owner_id, type, params, weight,
  is_hard, enabled, schema_version, created_at}``.
- Per brief §6.3 — twelve rule types frozen in ``schema_version = 1``.
- Per brief §6.4 — set-level conflict validation lives in the backend; this
  module enforces only structural and per-rule invariants.
- Per brief §7 — ``f_j ∈ [0, 1]``, equity modes utilitarian / max-min / Nash.
- Per brief §8.1 — ``SolverOutput`` shape, default ``time_budget_s = 30``.
- Per brief §17 — closed decisions for v1: day granularity, three equity
  modes, four task statuses, English code.

Backend Zod mirror reference (informational, not normative):

    ProblemInput      ↔ ProblemInputSchema
    SolverOutput      ↔ SolverOutputSchema
    Rule (union)      ↔ z.discriminatedUnion("type", [...])
    Enums (StrEnum)   ↔ z.enum([...])
"""

from __future__ import annotations

from datetime import date
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    TypeAdapter,
    model_validator,
)

# ---------------------------------------------------------------------------
# Base config — strict mode + extra=forbid for every contract model.
# ---------------------------------------------------------------------------


class _Strict(BaseModel):
    """Base model for contract types.

    ``strict=True`` rejects silent coercions (e.g. ``"5"`` for an ``int``).
    ``extra="forbid"`` fails loud when the wire format drifts (typos,
    deprecated fields). Mutability is allowed for ergonomic test setup but
    is discouraged across module boundaries.
    """

    model_config = ConfigDict(
        strict=True,
        extra="forbid",
        frozen=False,
        populate_by_name=False,
        str_strip_whitespace=False,
    )


# ---------------------------------------------------------------------------
# Enums (per brief §6.3, §7.4, §8.1).
# ---------------------------------------------------------------------------


class RunStatus(StrEnum):
    """Solver run terminal status (per brief §8.1)."""

    OPTIMAL = "OPTIMAL"
    FEASIBLE = "FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    TIMEOUT = "TIMEOUT"


class EquityMode(StrEnum):
    """Equity aggregation mode (per brief §7.4)."""

    UTILITARIAN = "UTILITARIAN"
    MAX_MIN = "MAX_MIN"
    NASH = "NASH"


class TaskStatus(StrEnum):
    """Task lifecycle status (per brief §5, §17)."""

    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    BLOCKED = "BLOCKED"


class TaskCategory(StrEnum):
    """Task category enumeration (per brief §6.3, Forma A)."""

    FEATURE = "feature"
    BUG = "bug"
    INFRA = "infra"
    SRE = "sre"
    ON_CALL = "on_call"
    DOCS = "docs"
    RESEARCH = "research"


class Weekday(StrEnum):
    """ISO weekday name (per brief §6.3, Forma B)."""

    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class RuleType(StrEnum):
    """Twelve rule types frozen in schema_version=1 (per brief §6.3)."""

    PREFER_SKILL = "PREFER_SKILL"
    AVOID_SKILL = "AVOID_SKILL"
    PREFER_CATEGORY = "PREFER_CATEGORY"
    AVOID_CATEGORY = "AVOID_CATEGORY"
    PREFER_DOMAIN = "PREFER_DOMAIN"
    PREFER_WEEKDAY = "PREFER_WEEKDAY"
    AVOID_WEEKDAY = "AVOID_WEEKDAY"
    BLACKOUT_DATE = "BLACKOUT_DATE"
    MAX_TASKS_PER_SPRINT = "MAX_TASKS_PER_SPRINT"
    FOCUS_PREFERENCE = "FOCUS_PREFERENCE"
    COOLDOWN_AFTER = "COOLDOWN_AFTER"
    LEARN_SKILL = "LEARN_SKILL"


# ---------------------------------------------------------------------------
# Domain entities (per brief §5).
# ---------------------------------------------------------------------------


class Skill(_Strict):
    """Skill catalog entry (per brief §5)."""

    id: str
    name: str


class UserSkill(_Strict):
    """Per-user skill assignment with proficiency level 1-5 (per brief §5)."""

    skill_id: str
    level: int = Field(ge=1, le=5)


class User(_Strict):
    """Sprint participant (per brief §5).

    Note: the ``role`` field from the brief is intentionally omitted from
    the solver contract — it is a backend authorization concern, not a
    planning input.
    """

    id: str
    name: str
    skills: list[UserSkill] = Field(default_factory=list)


class Sprint(_Strict):
    """Planning window with day-granularity (per brief §5)."""

    id: str
    name: str
    start_date: date
    duration_days: int = Field(ge=1)


class Task(_Strict):
    """Unit of work assigned to a single user (per brief §5)."""

    id: str
    name: str
    effort_days: int = Field(ge=1)
    required_skills: list[str] = Field(default_factory=list)
    category: TaskCategory
    domain: str
    deadline_day: int | None = Field(default=None, ge=0)
    depends_on: list[str] = Field(default_factory=list)
    status: TaskStatus = TaskStatus.TODO


class Assignment(_Strict):
    """Solver decision: task assigned to user starting on a sprint day."""

    task_id: str
    user_id: str
    start_day: int = Field(ge=0)


# ---------------------------------------------------------------------------
# Rule params — one model per rule type (per brief §6.3).
# ---------------------------------------------------------------------------


class PreferSkillParams(_Strict):
    skill_id: str


class AvoidSkillParams(_Strict):
    skill_id: str


class PreferCategoryParams(_Strict):
    category: TaskCategory


class AvoidCategoryParams(_Strict):
    category: TaskCategory


class PreferDomainParams(_Strict):
    domain: str


class PreferWeekdayParams(_Strict):
    weekday: Weekday


class AvoidWeekdayParams(_Strict):
    weekday: Weekday


class BlackoutDateParams(_Strict):
    dates: list[date]


class MaxTasksPerSprintParams(_Strict):
    """Per brief §6.3 — ``max`` renamed to ``max_tasks`` to avoid shadowing
    the Python builtin ``max``."""

    max_tasks: int = Field(ge=1)


class FocusPreferenceParams(_Strict):
    """Empty params — see brief §6.3 Forma C."""


class CooldownAfterParams(_Strict):
    after_category: TaskCategory
    rest_days: int = Field(ge=0)


class LearnSkillParams(_Strict):
    skill_id: str
    min_tasks: int = Field(ge=1)


# ---------------------------------------------------------------------------
# Rule envelopes — discriminated union on ``type`` (per brief §6.1, §6.3).
# ---------------------------------------------------------------------------


class _RuleBase(_Strict):
    """Shared rule envelope fields (per brief §6.1).

    ``weight`` is the budget cost in 0-100. Hard rules
    (``is_hard=True``) do not consume budget. ``BLACKOUT_DATE`` is always
    hard (enforced in ``RuleBlackoutDate``).
    """

    id: str
    owner_id: str
    weight: int = Field(ge=0, le=100, default=0)
    is_hard: bool = False
    enabled: bool = True
    schema_version: Literal[1] = 1


class RulePreferSkill(_RuleBase):
    type: Literal[RuleType.PREFER_SKILL] = RuleType.PREFER_SKILL
    params: PreferSkillParams


class RuleAvoidSkill(_RuleBase):
    type: Literal[RuleType.AVOID_SKILL] = RuleType.AVOID_SKILL
    params: AvoidSkillParams


class RulePreferCategory(_RuleBase):
    type: Literal[RuleType.PREFER_CATEGORY] = RuleType.PREFER_CATEGORY
    params: PreferCategoryParams


class RuleAvoidCategory(_RuleBase):
    type: Literal[RuleType.AVOID_CATEGORY] = RuleType.AVOID_CATEGORY
    params: AvoidCategoryParams


class RulePreferDomain(_RuleBase):
    type: Literal[RuleType.PREFER_DOMAIN] = RuleType.PREFER_DOMAIN
    params: PreferDomainParams


class RulePreferWeekday(_RuleBase):
    type: Literal[RuleType.PREFER_WEEKDAY] = RuleType.PREFER_WEEKDAY
    params: PreferWeekdayParams


class RuleAvoidWeekday(_RuleBase):
    type: Literal[RuleType.AVOID_WEEKDAY] = RuleType.AVOID_WEEKDAY
    params: AvoidWeekdayParams


class RuleBlackoutDate(_RuleBase):
    """Per brief §6.3 — ``BLACKOUT_DATE`` is always hard, ignores weight."""

    type: Literal[RuleType.BLACKOUT_DATE] = RuleType.BLACKOUT_DATE
    params: BlackoutDateParams

    @model_validator(mode="after")
    def _force_hard(self) -> RuleBlackoutDate:
        if not self.is_hard:
            raise ValueError("BLACKOUT_DATE rules must have is_hard=True")
        return self


class RuleMaxTasksPerSprint(_RuleBase):
    type: Literal[RuleType.MAX_TASKS_PER_SPRINT] = RuleType.MAX_TASKS_PER_SPRINT
    params: MaxTasksPerSprintParams


class RuleFocusPreference(_RuleBase):
    type: Literal[RuleType.FOCUS_PREFERENCE] = RuleType.FOCUS_PREFERENCE
    params: FocusPreferenceParams = Field(default_factory=FocusPreferenceParams)


class RuleCooldownAfter(_RuleBase):
    type: Literal[RuleType.COOLDOWN_AFTER] = RuleType.COOLDOWN_AFTER
    params: CooldownAfterParams


class RuleLearnSkill(_RuleBase):
    type: Literal[RuleType.LEARN_SKILL] = RuleType.LEARN_SKILL
    params: LearnSkillParams


Rule = Annotated[
    RulePreferSkill
    | RuleAvoidSkill
    | RulePreferCategory
    | RuleAvoidCategory
    | RulePreferDomain
    | RulePreferWeekday
    | RuleAvoidWeekday
    | RuleBlackoutDate
    | RuleMaxTasksPerSprint
    | RuleFocusPreference
    | RuleCooldownAfter
    | RuleLearnSkill,
    Field(discriminator="type"),
]
"""Discriminated union over the twelve rule envelopes (per brief §6.3)."""


RuleAdapter: TypeAdapter[Rule] = TypeAdapter(Rule)
"""TypeAdapter for parsing a raw dict / JSON into the correct ``Rule`` variant."""


# ---------------------------------------------------------------------------
# ProblemInput — solver payload root (per brief §8.1).
# ---------------------------------------------------------------------------


class ProblemInput(_Strict):
    """Solver input contract (per brief §8.1).

    Cross-field invariants enforced after parsing:
    - every ``rule.owner_id`` exists in ``users``;
    - every ``task.depends_on`` references an existing ``task.id`` and no
      task depends on itself;
    - every ``required_skills`` entry and ``user.skills[*].skill_id`` exists
      in ``skills``;
    - ``task.deadline_day``, if set, is strictly less than
      ``sprint.duration_days``.
    """

    sprint: Sprint
    users: list[User]
    tasks: list[Task]
    skills: list[Skill] = Field(default_factory=list)
    rules: list[Rule] = Field(default_factory=list)
    equity_mode: EquityMode = EquityMode.UTILITARIAN
    time_budget_s: float = Field(default=30.0, gt=0.0)

    @model_validator(mode="after")
    def _check_referential_integrity(self) -> ProblemInput:
        user_ids = {u.id for u in self.users}
        task_ids = {t.id for t in self.tasks}
        skill_ids = {s.id for s in self.skills}

        for r in self.rules:
            if r.owner_id not in user_ids:
                raise ValueError(
                    f"Rule {r.id!r} references unknown owner_id {r.owner_id!r}"
                )

        if skill_ids:
            for u in self.users:
                for us in u.skills:
                    if us.skill_id not in skill_ids:
                        raise ValueError(
                            f"User {u.id!r} has unknown skill_id {us.skill_id!r}"
                        )

        for t in self.tasks:
            if skill_ids:
                for sk in t.required_skills:
                    if sk not in skill_ids:
                        raise ValueError(
                            f"Task {t.id!r} requires unknown skill {sk!r}"
                        )
            for dep in t.depends_on:
                if dep not in task_ids:
                    raise ValueError(
                        f"Task {t.id!r} depends on unknown task {dep!r}"
                    )
            if t.id in t.depends_on:
                raise ValueError(f"Task {t.id!r} depends on itself")
            if (
                t.deadline_day is not None
                and t.deadline_day >= self.sprint.duration_days
            ):
                raise ValueError(
                    f"Task {t.id!r} deadline_day {t.deadline_day} "
                    f">= sprint duration {self.sprint.duration_days}"
                )

        if self.sprint.duration_days <= 0:
            raise ValueError("sprint.duration_days must be > 0")

        return self


# ---------------------------------------------------------------------------
# SolverOutput — solver response (per brief §8.1).
# ---------------------------------------------------------------------------


class UserHappiness(_Strict):
    """Per-user happiness score (per brief §7.3, §8.1).

    The brief shows ``{user_id: f_j}`` as a map; we use a list of typed
    records to enable per-element validation (``f_j ∈ [0, 1]``) and a clean
    OpenAPI / Zod schema. Semantically equivalent to a map keyed by user_id.
    """

    user_id: str
    f_j: float = Field(ge=0.0, le=1.0)


class RuleEvaluation(_Strict):
    """Per-rule evaluation result (per brief §7.3, §8.1).

    ``satisfied`` is collapsed from ``bool | float`` in the brief to a
    single ``float ∈ [0, 1]``: a boolean is a degenerate float (0.0 or 1.0)
    and the math in §7.5 treats every rule as fractional anyway.
    """

    rule_id: str
    satisfied: float = Field(ge=0.0, le=1.0)
    contribution: float


class SolverStats(_Strict):
    """Solver execution stats (per brief §8.1)."""

    wall_time_ms: float = Field(ge=0.0)
    conflicts: int = Field(ge=0)
    branches: int = Field(ge=0)
    solver_status: str


class SolverOutput(_Strict):
    """Solver response contract (per brief §8.1).

    Cross-field invariants enforced after parsing:
    - ``status == INFEASIBLE`` ⇒ ``assignments == []`` AND
      ``objective_value is None``;
    - ``status ∈ {OPTIMAL, FEASIBLE}`` ⇒ ``objective_value is not None``;
    - ``status == TIMEOUT`` is unconstrained (best-so-far solution may or
      may not exist).
    """

    status: RunStatus
    assignments: list[Assignment] = Field(default_factory=list)
    objective_value: float | None = None
    per_user_happiness: list[UserHappiness] = Field(default_factory=list)
    rule_evaluations: list[RuleEvaluation] = Field(default_factory=list)
    solver_stats: SolverStats
    # Brief §8.1: human-readable explanation for non-OPTIMAL terminal states.
    message: str | None = None

    @model_validator(mode="after")
    def _check_status_invariants(self) -> SolverOutput:
        if self.status == RunStatus.INFEASIBLE:
            if self.assignments:
                raise ValueError("INFEASIBLE solutions cannot have assignments")
            if self.objective_value is not None:
                raise ValueError(
                    "INFEASIBLE solutions must have objective_value=None"
                )
        if self.status in (RunStatus.OPTIMAL, RunStatus.FEASIBLE):
            if self.objective_value is None:
                raise ValueError(
                    f"{self.status.value} solutions must have a "
                    "non-null objective_value"
                )
        return self


__all__ = [
    # Enums
    "RunStatus",
    "EquityMode",
    "TaskStatus",
    "TaskCategory",
    "Weekday",
    "RuleType",
    # Domain
    "Skill",
    "UserSkill",
    "User",
    "Sprint",
    "Task",
    "Assignment",
    # Rule params
    "PreferSkillParams",
    "AvoidSkillParams",
    "PreferCategoryParams",
    "AvoidCategoryParams",
    "PreferDomainParams",
    "PreferWeekdayParams",
    "AvoidWeekdayParams",
    "BlackoutDateParams",
    "MaxTasksPerSprintParams",
    "FocusPreferenceParams",
    "CooldownAfterParams",
    "LearnSkillParams",
    # Rule envelopes
    "RulePreferSkill",
    "RuleAvoidSkill",
    "RulePreferCategory",
    "RuleAvoidCategory",
    "RulePreferDomain",
    "RulePreferWeekday",
    "RuleAvoidWeekday",
    "RuleBlackoutDate",
    "RuleMaxTasksPerSprint",
    "RuleFocusPreference",
    "RuleCooldownAfter",
    "RuleLearnSkill",
    "Rule",
    "RuleAdapter",
    # Input / output
    "ProblemInput",
    "UserHappiness",
    "RuleEvaluation",
    "SolverStats",
    "SolverOutput",
]
