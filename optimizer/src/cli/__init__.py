"""SprintWell solver CLI.

Run via ``python -m cli solve --input X --out Y`` (within the optimizer
project, courtesy of the flattened ``sources=["src"]`` packaging from #13)
or ``sprintwell-solve --input X --out Y`` after install.

See:
- GitHub issue #23.
- sdd/cli-solver-runner/explore.
"""

from cli.main import main

__all__ = ["main"]
