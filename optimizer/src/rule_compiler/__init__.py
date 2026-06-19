"""RuleCompiler contract and type registry (issue #25).

Brief §6.3 freezes twelve rule types in ``schema_version = 1``. Each type must
be translated into CP-SAT constructs — a hard constraint, a soft objective
term, or both — and layered on top of the base model (R1-R6 from
``solvers.cpsat``) WITHOUT turning the solver into a giant ``if/elif``. This
module ships the dispatch machinery that makes adding a rule type a local,
type-checked operation:

- :data:`ObjectiveTerm` — the (OR-Tools-typed) soft contribution a compiler
  may return, or ``None`` for a pure hard-constraint rule.
- :class:`RuleCompiler` — the structural contract every per-type compiler
  honours: ``compile(rule, model, vars) -> ObjectiveTerm | None``. It is a
  callable ``Protocol``, so any plain function with that signature qualifies —
  matching the functional style of ``solvers.cpsat``; compilers register as
  functions, not classes.
- :data:`REGISTRY` — the extensible ``{RuleType: RuleCompiler}`` dispatch
  table, populated via the :func:`register` decorator.
- :func:`compile_rule` / :func:`compile_all` — dispatch one rule / assemble
  the soft objective terms for an iterable of rules.

The concrete compilers (PREFER_SKILL, AVOID_CATEGORY, LEARN_SKILL, ...) land in
issues #26-#34. This issue ships only the contract and the dispatch table; the
tests exercise it with dummy compilers.

See:
- GitHub issue #25.
- Brief §6.3 (frozen rule types), §7.5 (objective assembly).
- ``solvers.cpsat`` — the base model whose decision variables compilers read.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable
from typing import Any, Protocol

from models import Rule, RuleType
from solvers.cpsat import BaseModelVars

__all__ = [
    "REGISTRY",
    "ObjectiveTerm",
    "RuleCompiler",
    "UnregisteredRuleTypeError",
    "compile_all",
    "compile_rule",
    "register",
]


ObjectiveTerm = Any
"""A CP-SAT linear expression contributing to the global soft objective.

Typed ``Any`` for the same reason the solver code is: the
``[[tool.mypy.overrides]] module = "ortools.*"`` config in ``pyproject.toml``
returns ``Any`` for every OR-Tools handle. A compiler returns ``None`` when its
rule is a pure hard constraint (e.g. ``BLACKOUT_DATE``) and contributes no term.
"""


class RuleCompiler(Protocol):
    """Structural contract for a single rule-type compiler.

    A compiler takes a validated :class:`~models.Rule`, mutates the CP-SAT
    ``model`` in place — adding hard constraints and/or auxiliary variables
    against the decision variables in ``vars`` — and returns an
    :data:`ObjectiveTerm` representing its weighted soft contribution, or
    ``None`` when the rule is a pure hard constraint.

    This is a *callable* protocol: any plain function with the
    ``compile(rule, model, vars)`` signature satisfies it structurally, so
    compilers are stored as functions in :data:`REGISTRY` rather than as
    classes — consistent with the functional style of ``solvers.cpsat``.
    """

    def __call__(self, rule: Rule, model: Any, vars: BaseModelVars) -> ObjectiveTerm | None: ...


class UnregisteredRuleTypeError(KeyError):
    """Raised when dispatching a rule whose type has no registered compiler."""


REGISTRY: dict[RuleType, RuleCompiler] = {}
"""Dispatch table mapping each :class:`~models.RuleType` to its compiler.

Empty until issues #26-#34 register the concrete compilers via
:func:`register`. Inject a private table into :func:`compile_rule` /
:func:`compile_all` (the ``registry`` keyword) to dispatch against an
alternative set — the seam the tests use.
"""


def register(rule_type: RuleType) -> Callable[[RuleCompiler], RuleCompiler]:
    """Register the decorated function as the compiler for ``rule_type``.

    Returns the function unchanged so it stays directly callable and testable.
    A second registration for the same type fails loud (``ValueError``) instead
    of silently shadowing the first — duplicate wiring is a bug, not a feature.

    Usage (in a future issue's compiler module)::

        @register(RuleType.PREFER_SKILL)
        def compile_prefer_skill(rule, model, vars):
            ...
            return term
    """

    def _decorator(fn: RuleCompiler) -> RuleCompiler:
        if rule_type in REGISTRY:
            raise ValueError(f"A compiler is already registered for rule type {rule_type!r}")
        REGISTRY[rule_type] = fn
        return fn

    return _decorator


def compile_rule(
    rule: Rule,
    model: Any,
    vars: BaseModelVars,
    *,
    registry: dict[RuleType, RuleCompiler] | None = None,
) -> ObjectiveTerm | None:
    """Dispatch a single rule to its registered compiler.

    Disabled rules (``enabled = False``, per brief §6.1) are skipped and
    contribute nothing — neither constraints nor an objective term.

    Args:
        rule: the validated rule to compile.
        model: the CP-SAT ``CpModel`` the compiler mutates in place.
        vars: the base-model decision variables the compiler reads.
        registry: dispatch table to use; defaults to the module-level
            :data:`REGISTRY`. Pass a private table to dispatch in isolation.

    Raises:
        UnregisteredRuleTypeError: no compiler is registered for ``rule.type``.
    """
    if not rule.enabled:
        return None
    table = registry if registry is not None else REGISTRY
    try:
        compiler = table[rule.type]
    except KeyError as exc:
        raise UnregisteredRuleTypeError(
            f"No compiler registered for rule type {rule.type!r}"
        ) from exc
    return compiler(rule, model, vars)


def compile_all(
    rules: Iterable[Rule],
    model: Any,
    vars: BaseModelVars,
    *,
    registry: dict[RuleType, RuleCompiler] | None = None,
) -> list[ObjectiveTerm]:
    """Compile every rule, returning the non-null soft objective terms.

    Each rule is dispatched via :func:`compile_rule`, so hard-only compilers
    (returning ``None``) still run for their side effects on ``model`` but add
    nothing to the returned list. The caller folds the returned terms into the
    global objective (brief §7.5). Term order follows ``rules`` iteration order.
    """
    terms: list[ObjectiveTerm] = []
    for rule in rules:
        term = compile_rule(rule, model, vars, registry=registry)
        if term is not None:
            terms.append(term)
    return terms


# Importing the per-type compiler modules registers their RuleCompiler
# functions in REGISTRY via the ``@register`` decorator (import side effect).
# Kept at the very bottom so every name they import from this package
# (``register``, ``ObjectiveTerm``, ...) is already defined above.
from . import blackout_date as _blackout_date  # noqa: E402, F401
from . import cooldown_after as _cooldown_after  # noqa: E402, F401
from . import focus_preference as _focus_preference  # noqa: E402, F401
from . import learn_skill as _learn_skill  # noqa: E402, F401
from . import max_tasks_per_sprint as _max_tasks_per_sprint  # noqa: E402, F401
from . import prefer_avoid_category as _prefer_avoid_category  # noqa: E402, F401
from . import prefer_avoid_skill as _prefer_avoid_skill  # noqa: E402, F401
from . import prefer_avoid_weekday as _prefer_avoid_weekday  # noqa: E402, F401
from . import prefer_domain as _prefer_domain  # noqa: E402, F401
