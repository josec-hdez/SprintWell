"""FastAPI entry point for the SprintWell optimizer microservice."""

from fastapi import FastAPI

# Eager import: if the OR-Tools native library cannot load, fail at startup
# instead of at the first solver request.
from ortools.sat.python import cp_model  # noqa: F401

app = FastAPI(
    title="SprintWell Optimizer",
    version="0.1.0",
    description="Sprint planning optimizer powered by OR-Tools CP-SAT.",
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe used by the backend and orchestration."""
    return {"status": "ok"}
