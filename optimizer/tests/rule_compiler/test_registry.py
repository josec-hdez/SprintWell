"""Dispatch tests for the RuleCompiler registry (issue #25).

The concrete per-type compilers land in issues #26-#34; here we exercise the
dispatch machinery itself with dummy compilers, against a real ``(model, vars)``
pair so the contract is checked against the actual ``solvers.cpsat`` types.

See:
- GitHub issue #25.
- Brief §6.3 (frozen rule types), §6.1 (rule envelope, ``enabled`` field).
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date
from typing import Any

import pytest

from models import (
    PreferDomainParams,
    PreferSkillParams,
    ProblemInput,
    Rule,
    RulePreferDomain,
    RulePreferSkill,
    RuleType,
    Sprint,
    Task,
    TaskCategory,
    User,
)
from rule_compiler import (
    REGISTRY,
    RuleCompiler,
    UnregisteredRuleTypeError,
    compile_all,
    compile_rule,
    register,
)
from solvers.cpsat import BaseModelVars, build_base_model


@pytest.fixture
def model_and_vars() -> tuple[Any, BaseModelVars]:
    """A real CP-SAT base model so dispatch is tested against actual types."""
    problem = ProblemInput(
        sprint=Sprint(
            id="s1",
            name="Sprint",
            start_date=date(2026, 5, 4),
            duration_days=5,
        ),
        users=[User(id="u1", name="U1", skills=[])],
        tasks=[
            Task(
                id="t1",
                name="t1",
                effort_days=1,
                required_skills=[],
                category=TaskCategory.FEATURE,
                domain="d",
                depends_on=[],
            )
        ],
    )
    return build_base_model(problem)


@pytest.fixture
def clean_registry() -> Iterator[None]:
    """Snapshot and restore the global REGISTRY around tests that mutate it."""
    snapshot = dict(REGISTRY)
    try:
        yield
    finally:
        REGISTRY.clear()
        REGISTRY.update(snapshot)


def _prefer_skill_rule(*, enabled: bool = True) -> RulePreferSkill:
    return RulePreferSkill(
        id="r_skill",
        owner_id="u1",
        params=PreferSkillParams(skill_id="s1"),
        enabled=enabled,
    )


def _prefer_domain_rule() -> RulePreferDomain:
    return RulePreferDomain(
        id="r_domain",
        owner_id="u1",
        params=PreferDomainParams(domain="payments"),
    )


def test_dispatch_routes_to_compiler_for_rule_type(
    model_and_vars: tuple[Any, BaseModelVars],
) -> None:
    """``compile_rule`` calls the compiler bound to ``rule.type`` and returns its term."""
    model, vars_ = model_and_vars
    seen: list[tuple[Rule, Any, BaseModelVars]] = []

    def dummy(rule: Rule, model: Any, vars: BaseModelVars) -> str:
        seen.append((rule, model, vars))
        return "skill-term"

    registry: dict[RuleType, RuleCompiler] = {RuleType.PREFER_SKILL: dummy}
    rule = _prefer_skill_rule()

    term = compile_rule(rule, model, vars_, registry=registry)

    assert term == "skill-term"
    assert seen == [(rule, model, vars_)]  # exact (rule, model, vars) forwarded


def test_dispatch_is_keyed_by_type_not_first_entry(
    model_and_vars: tuple[Any, BaseModelVars],
) -> None:
    """With two types registered, each rule reaches its own compiler."""
    model, vars_ = model_and_vars

    def skill(rule: Rule, model: Any, vars: BaseModelVars) -> str:
        return "skill"

    def domain(rule: Rule, model: Any, vars: BaseModelVars) -> str:
        return "domain"

    registry: dict[RuleType, RuleCompiler] = {
        RuleType.PREFER_SKILL: skill,
        RuleType.PREFER_DOMAIN: domain,
    }

    assert compile_rule(_prefer_skill_rule(), model, vars_, registry=registry) == "skill"
    assert compile_rule(_prefer_domain_rule(), model, vars_, registry=registry) == "domain"


def test_unregistered_type_raises(
    model_and_vars: tuple[Any, BaseModelVars],
) -> None:
    """Dispatching a type with no compiler fails loud."""
    model, vars_ = model_and_vars
    with pytest.raises(UnregisteredRuleTypeError, match="PREFER_SKILL"):
        compile_rule(_prefer_skill_rule(), model, vars_, registry={})


def test_disabled_rule_is_skipped(
    model_and_vars: tuple[Any, BaseModelVars],
) -> None:
    """``enabled=False`` rules contribute nothing and never reach the compiler."""
    model, vars_ = model_and_vars
    called = False

    def dummy(rule: Rule, model: Any, vars: BaseModelVars) -> str:
        nonlocal called
        called = True
        return "term"

    registry: dict[RuleType, RuleCompiler] = {RuleType.PREFER_SKILL: dummy}
    term = compile_rule(_prefer_skill_rule(enabled=False), model, vars_, registry=registry)

    assert term is None
    assert called is False


def test_compile_all_collects_only_non_null_terms(
    model_and_vars: tuple[Any, BaseModelVars],
) -> None:
    """Soft compilers contribute terms; hard-only compilers (None) do not."""
    model, vars_ = model_and_vars

    def soft(rule: Rule, model: Any, vars: BaseModelVars) -> str:
        return "soft-term"

    def hard(rule: Rule, model: Any, vars: BaseModelVars) -> None:
        return None  # pure hard constraint, no objective contribution

    registry: dict[RuleType, RuleCompiler] = {
        RuleType.PREFER_SKILL: soft,
        RuleType.PREFER_DOMAIN: hard,
    }
    rules: list[Rule] = [_prefer_skill_rule(), _prefer_domain_rule()]

    terms = compile_all(rules, model, vars_, registry=registry)

    assert terms == ["soft-term"]


def test_register_decorator_populates_global_registry(
    clean_registry: None,
) -> None:
    """The ``@register`` decorator wires a function into the global REGISTRY."""

    @register(RuleType.PREFER_DOMAIN)
    def compiler(rule: Rule, model: Any, vars: BaseModelVars) -> None:
        return None

    assert REGISTRY[RuleType.PREFER_DOMAIN] is compiler


def test_register_rejects_duplicate_type(
    clean_registry: None,
) -> None:
    """A second compiler for the same type fails loud instead of shadowing."""

    @register(RuleType.PREFER_DOMAIN)
    def first(rule: Rule, model: Any, vars: BaseModelVars) -> None:
        return None

    with pytest.raises(ValueError, match="already registered"):

        @register(RuleType.PREFER_DOMAIN)
        def second(rule: Rule, model: Any, vars: BaseModelVars) -> None:
            return None
