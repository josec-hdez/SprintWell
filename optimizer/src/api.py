"""FastAPI entry point for the SprintWell optimizer microservice."""

from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse

# Eager import: if the OR-Tools native library cannot load, fail at startup
# instead of at the first solver request.
from ortools.sat.python import cp_model  # noqa: F401
from pydantic import ValidationError

from models import ProblemInput, SolverOutput
from solvers.greedy import solve_greedy
from solvers.random import solve_random
from solvers.runner import solve_problem

Algorithm = Literal["cpsat", "random", "greedy"]
"""Selectable solver algorithms (brief §8): CP-SAT optimiser, or the random /
greedy skill-match baselines (§8.2-§8.3)."""

app = FastAPI(
    title="SprintWell Optimizer",
    version="0.1.0",
    description="Sprint planning optimizer powered by OR-Tools CP-SAT.",
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe used by the backend and orchestration."""
    return {"status": "ok"}


@app.post(
    "/solve",
    response_model=SolverOutput,
    summary="Solve a sprint planning problem",
    description=(
        "Receives a `ProblemInput` and returns a `SolverOutput` per brief §8.1. "
        "Frontier of the optimizer microservice; called synchronously by the backend (§4.3). "
        "Timeout is configured via `ProblemInput.time_budget_s` (default 30 s). "
        "`algorithm` selects the CP-SAT optimiser (default) or the random baseline (§8.2)."
    ),
)
async def post_solve(
    request: Request,
    algorithm: Annotated[
        Algorithm,
        Query(
            description="Solver to run: `cpsat` (optimiser), or `random` / `greedy` (baselines)."
        ),
    ] = "cpsat",
) -> SolverOutput | JSONResponse:
    # The contract models use ``strict=True`` (see models._Strict), which
    # rejects the standard JSON coercions (date strings → date, enum strings
    # → StrEnum) on the Python-validation path FastAPI uses by default.
    # Parse the raw body and validate via the JSON path so the strict
    # invariants stay intact while the wire format is honored.
    raw_body = await request.body()
    try:
        problem = ProblemInput.model_validate_json(raw_body)
    except ValidationError as exc:
        # Mirror FastAPI's default 422 envelope shape: ``{"detail": [...]}``.
        return JSONResponse(status_code=422, content={"detail": exc.errors(include_url=False)})

    try:
        if algorithm == "random":
            return solve_random(problem)
        if algorithm == "greedy":
            return solve_greedy(problem)
        return solve_problem(problem)
    except RuntimeError as exc:
        # MODEL_INVALID from CP-SAT — builder bug, surface as 500.
        raise HTTPException(status_code=500, detail=f"Solver builder error: {exc}") from exc
