"""Solver implementations for the SprintWell optimizer.

Currently exports the CP-SAT base model builder (issue #18). Random and
greedy baselines land in later issues.
"""

from .cpsat import BaseModelVars, attach_trivial_objective, build_base_model

__all__ = ["BaseModelVars", "attach_trivial_objective", "build_base_model"]
