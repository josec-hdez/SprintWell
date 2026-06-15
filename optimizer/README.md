# optimizer

Python 3.11 + OR-Tools (CP-SAT) + FastAPI microservice. Receives a planning
problem as JSON and returns assignments plus metrics (brief §8). Lives apart
from the backend because CP-SAT's best binding is Python (brief §4.3).

## Layout

```
optimizer/
├── pyproject.toml
├── src/
│   ├── api.py              # FastAPI app (issue #13)
│   ├── cli/                # solver CLI (issue #23)
│   ├── solvers/            # cpsat.py, random.py, greedy.py (week 2)
│   └── rule_compiler/      # DSL → CP-SAT constraints (week 2–3)
├── tests/                  # pytest suite
└── cli/                    # synthetic dataset generator (week 2)
```

## Requirements

- Python 3.11 (pinned — OR-Tools wheels are tied to a Python minor version).
- One of: `uv` (recommended) or `pip` + `venv`.

## Install

With `uv` (recommended):

```bash
uv sync --all-extras
```

With plain `pip`:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Run the API

```bash
uvicorn src.api:app --host 0.0.0.0 --port "${OPTIMIZER_PORT:-8000}" --reload
```

Health check: `curl http://localhost:8000/health` → `{"status":"ok"}`.

## Command-line interface (CLI)

The optimizer ships with a `solve` CLI that runs the same pipeline as the `POST /solve` endpoint, reading a `ProblemInput` JSON file and writing a `SolverOutput` JSON file. Useful for local debugging, benchmarking scripts, and CI smoke checks where bringing up the HTTP service is overkill.

Two invocations are supported (both equivalent):

```bash
# Module form — works inside the optimizer project (flattened src layout, see #13).
uv run python -m cli solve --input instance.json --out result.json

# Script form — registered via [project.scripts] in pyproject.toml.
uv run sprintwell-solve solve --input instance.json --out result.json

# Stdout mode: write the SolverOutput JSON to stdout for piping.
uv run sprintwell-solve solve -i instance.json -o - | jq .status
```

> Note: issue #23 originally describes the command as `python -m optimizer.cli ...`. The actual invocation uses `python -m cli` because the hatchling config from #13 (`sources = ["src"]`) flattens the package layout — there is no `optimizer.` import prefix anywhere in the codebase. Acceptance is met all the same.

Use `--quiet` / `-q` to suppress the informational stderr line (the default prints `Solved in N ms — status=...` after each run).

Exit codes:

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | `RunStatus.OPTIMAL` or `RunStatus.FEASIBLE` (success).          |
| `1`  | `RunStatus.INFEASIBLE` or `RunStatus.TIMEOUT` (no good answer). |
| `2`  | Input JSON failed Pydantic validation.                          |
| `3`  | Input file does not exist.                                      |
| `4`  | CP-SAT reported `MODEL_INVALID` (builder bug).                  |

## Environment

| Variable         | Default | Purpose                         |
| ---------------- | ------- | ------------------------------- |
| `OPTIMIZER_PORT` | `8000`  | Port uvicorn listens on locally |

## Quality gates

```bash
uv run ruff check .
uv run mypy src
uv run pytest
```

## CI

`.github/workflows/optimizer.yml` runs `ruff check .` and `pytest --quiet` on
every PR that touches `optimizer/**`. The workflow gates on
`optimizer/pyproject.toml` existing.
