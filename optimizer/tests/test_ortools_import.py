"""Acceptance test: OR-Tools native library loads on this host (issue #13)."""

from ortools.sat.python import cp_model


def test_cp_model_constructs() -> None:
    """Building an empty CpModel exercises the native binding."""
    model = cp_model.CpModel()
    assert model is not None
