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
