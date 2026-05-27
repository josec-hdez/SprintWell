# optimizer

Python 3.11 + OR-Tools (CP-SAT) + FastAPI microservice. Receives a planning problem as JSON and returns assignments plus metrics (brief §8). Lives apart from the backend because CP-SAT's best binding is Python (brief §4.3).

Per-service tooling (`pyproject.toml`, FastAPI `api.py`) is bootstrapped in later week-1/week-2 issues.
