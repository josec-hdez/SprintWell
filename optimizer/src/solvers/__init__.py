"""Solver implementations for the SprintWell optimizer.

Exports the CP-SAT base model builder (issue #18), the trivial objective
attacher (issue #19), and the solve runner that maps OR-Tools statuses to
``SolverOutput`` (issue #20). Random and greedy baselines land in later
issues.
"""

from .cpsat import BaseModelVars, attach_trivial_objective, build_base_model
from .runner import solve, solve_problem

__all__ = [
    "BaseModelVars",
    "attach_trivial_objective",
    "build_base_model",
    "solve",
    "solve_problem",
]
