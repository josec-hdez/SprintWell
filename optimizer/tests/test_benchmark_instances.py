"""Validation of the committed benchmark instance set (issue #41).

Guards the 12 fixed instances in ``benchmarks/instances/`` against corruption:
each must parse against the strict ``ProblemInput`` schema, and the set must
cover the 4 scales × 3 equity modes.

See:
- GitHub issue #41.
- Brief §13.2 (reproducible benchmark set).
"""

from __future__ import annotations

from pathlib import Path

import pytest

from models import EquityMode, ProblemInput

_INSTANCES_DIR = Path(__file__).resolve().parents[2] / "benchmarks" / "instances"
_SCALES = ("s1_small", "s2_medium", "s3_large", "s4_xl")
_MODES = {
    "utilitarian": EquityMode.UTILITARIAN,
    "max-min": EquityMode.MAX_MIN,
    "nash": EquityMode.NASH,
}


def _instance_files() -> list[Path]:
    return sorted(_INSTANCES_DIR.glob("*.json"))


def test_there_are_twelve_instances() -> None:
    """4 scales × 3 modes = 12 committed instances."""
    assert len(_instance_files()) == 12


@pytest.mark.parametrize("scale", _SCALES)
@pytest.mark.parametrize("mode", sorted(_MODES))
def test_instance_validates_and_records_its_mode(scale: str, mode: str) -> None:
    """Every {scale}_{mode}.json parses and carries the expected equity mode."""
    path = _INSTANCES_DIR / f"{scale}_{mode}.json"
    assert path.exists(), f"missing benchmark instance: {path.name}"
    problem = ProblemInput.model_validate_json(path.read_text(encoding="utf-8"))
    assert problem.equity_mode == _MODES[mode]


@pytest.mark.parametrize("scale", _SCALES)
def test_modes_of_a_scale_share_the_same_problem(scale: str) -> None:
    """For one scale the three files differ only in ``equity_mode``."""
    problems = {
        mode: ProblemInput.model_validate_json(
            (_INSTANCES_DIR / f"{scale}_{mode}.json").read_text(encoding="utf-8")
        )
        for mode in _MODES
    }
    baseline = problems["utilitarian"].model_copy(update={"equity_mode": EquityMode.UTILITARIAN})
    for mode, problem in problems.items():
        normalized = problem.model_copy(update={"equity_mode": EquityMode.UTILITARIAN})
        assert normalized == baseline, f"{scale}_{mode} differs beyond equity_mode"
