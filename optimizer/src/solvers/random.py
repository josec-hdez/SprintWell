"""Random baseline solver (issue #38).

Brief §8.2: an absolute floor for the benchmark — how much wellbeing does a
preference-blind assignment produce? It must respect the *structural* hard
constraints (R1 unique assignment, R2 no per-user overlap, R3 horizon, R4
deadlines, R5 dependencies) so its output is a valid schedule, but it ignores
R6 (skill minimum) and every preference rule.

Implementation — random objective over the structural feasible region:

We reuse ``build_base_model`` with ``skill_threshold = 0``, which collapses the
R6 filter to a no-op (a level is never ``< 0``), leaving exactly R1-R5. We then
maximise a random linear objective — a fresh random reward per ``(task, user)``
pair — so CP-SAT returns a *valid* but preference-blind, randomised assignment.
Validity is guaranteed by construction (CP-SAT only returns feasible solutions);
randomness comes from the seeded coefficients.

The resulting schedule still flows through the same ``solve`` reporting path, so
``rule_evaluations`` / ``per_user_happiness`` are populated — which is the point:
the benchmark reads the (typically low) happiness this blind baseline achieves.

See:
- GitHub issue #38.
- Brief §8.2 (random baseline), §7.2 (R1-R5 structural constraints).
"""

from __future__ import annotations

import random as _random

from models import ProblemInput, SolverOutput

from .cpsat import build_base_model
from .runner import solve

__all__ = ["solve_random"]

_MAX_COEFFICIENT = 1000
"""Upper bound for the random per-assignment reward (resolution of the shuffle)."""


def solve_random(problem: ProblemInput, *, seed: int | None = None) -> SolverOutput:
    """Solve with a preference-blind random baseline respecting R1-R5.

    ``seed`` makes the draw reproducible (used by tests / benchmarks); ``None``
    draws from system entropy.
    """
    # skill_threshold=0 turns R6 into a no-op, leaving R1-R5 structural only.
    model, model_vars = build_base_model(problem, skill_threshold=0)
    rng = _random.Random(seed)
    reward = sum(
        rng.randint(0, _MAX_COEFFICIENT) * model_vars.assigned[task.id, user.id]
        for task in problem.tasks
        for user in problem.users
    )
    model.maximize(reward)
    return solve(model, model_vars, time_budget_s=problem.time_budget_s)
