"""CLI implementation for the SprintWell optimizer (issue #23).

Reads a ``ProblemInput`` JSON from ``--input``, runs ``solve_problem`` from
``solvers.runner`` (the same pipeline as ``POST /solve``), and writes the
resulting ``SolverOutput`` to ``--out`` (or stdout when ``-``).

Exit codes:

* ``0`` — status ``OPTIMAL`` or ``FEASIBLE``.
* ``1`` — status ``INFEASIBLE`` or ``TIMEOUT``.
* ``2`` — invalid input JSON (pydantic ``ValidationError``).
* ``3`` — input file not found (``FileNotFoundError``).
* ``4`` — solver builder bug (``RuntimeError`` from CP-SAT ``MODEL_INVALID``).

See:
- GitHub issue #23.
- sdd/cli-solver-runner/explore.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pydantic import ValidationError

from models import ProblemInput, RunStatus
from solvers.runner import solve_problem

# Exit codes — exposed as module-level constants so tests and docs can refer
# to the same values.
EXIT_OK = 0
EXIT_UNSAT = 1
EXIT_VALIDATION = 2
EXIT_MISSING_INPUT = 3
EXIT_BUILDER_BUG = 4

_TERMINAL_OK = frozenset({RunStatus.OPTIMAL, RunStatus.FEASIBLE})

_SOLVE_DESCRIPTION = (
    "Solve a ProblemInput JSON instance and write the SolverOutput JSON.\n"
    "\n"
    "Exit codes:\n"
    "  0  status OPTIMAL or FEASIBLE\n"
    "  1  status INFEASIBLE or TIMEOUT\n"
    "  2  invalid input JSON (pydantic ValidationError)\n"
    "  3  input file not found\n"
    "  4  solver builder bug (CP-SAT MODEL_INVALID)"
)


def _build_parser() -> argparse.ArgumentParser:
    """Build the top-level parser with the ``solve`` subcommand.

    Subparsers are configured with ``required=True`` so ``python -m cli`` with
    no subcommand fails fast with a usage error.
    """
    parser = argparse.ArgumentParser(
        prog="sprintwell-solve",
        description="Run the SprintWell CP-SAT solver from JSON files.",
    )
    subparsers = parser.add_subparsers(
        dest="command",
        required=True,
        metavar="COMMAND",
    )

    solve_parser = subparsers.add_parser(
        "solve",
        help="Solve a ProblemInput JSON.",
        description=_SOLVE_DESCRIPTION,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    solve_parser.add_argument(
        "--input",
        "-i",
        required=True,
        type=Path,
        help="Path to a ProblemInput JSON file.",
    )
    solve_parser.add_argument(
        "--out",
        "-o",
        required=True,
        type=str,
        help="Path to write the SolverOutput JSON ('-' writes to stdout).",
    )
    solve_parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Suppress informational stderr output.",
    )
    return parser


def _render_validation_error(exc: ValidationError) -> str:
    """Render a pydantic ``ValidationError`` as a multi-line, human-readable string."""
    lines = ["Invalid ProblemInput JSON:"]
    for err in exc.errors(include_url=False):
        loc = ".".join(str(part) for part in err["loc"])
        lines.append(f"  - {loc}: {err['msg']} ({err['type']})")
    return "\n".join(lines)


def _cmd_solve(*, input_path: Path, out: str, quiet: bool) -> int:
    """Body of the ``solve`` subcommand.

    Arguments are unpacked from the argparse Namespace by ``main`` to keep
    mypy strict happy (Namespace has no static type information).
    """
    try:
        raw = input_path.read_bytes()
    except FileNotFoundError:
        print(f"error: input file not found: {input_path}", file=sys.stderr)
        return EXIT_MISSING_INPUT

    try:
        problem = ProblemInput.model_validate_json(raw)
    except ValidationError as exc:
        print(_render_validation_error(exc), file=sys.stderr)
        return EXIT_VALIDATION

    try:
        output = solve_problem(problem)
    except RuntimeError as exc:
        # CP-SAT MODEL_INVALID is mapped to RuntimeError by solvers.runner.
        print(f"error: solver builder bug: {exc}", file=sys.stderr)
        return EXIT_BUILDER_BUG

    payload = output.model_dump_json(indent=2)
    if out == "-":
        sys.stdout.write(payload + "\n")
    else:
        Path(out).write_text(payload + "\n", encoding="utf-8")

    if not quiet:
        wall_ms = output.solver_stats.wall_time_ms
        print(
            f"Solved in {wall_ms:.1f} ms — status={output.status.value}",
            file=sys.stderr,
        )

    return EXIT_OK if output.status in _TERMINAL_OK else EXIT_UNSAT


def main(argv: list[str] | None = None) -> int:
    """CLI entry point. Returns an exit code (no ``SystemExit`` raised here).

    Splitting this from ``__main__.py`` keeps the function testable without
    spawning a subprocess — tests call ``main([...])`` directly.
    """
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.command == "solve":
        return _cmd_solve(
            input_path=args.input,
            out=args.out,
            quiet=args.quiet,
        )
    # ``required=True`` on the subparser makes this unreachable, but keep an
    # explicit fallback so mypy sees a return on every path.
    parser.error(f"unknown command: {args.command}")
    return 64  # sysexits EX_USAGE — defensive only.
