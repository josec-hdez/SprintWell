# Optimizer service — Python 3.11 + OR-Tools CP-SAT + FastAPI, managed by uv.
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# Project metadata + source (hatchling builds the package from `src/`).
COPY pyproject.toml uv.lock README.md ./
COPY src ./src

# Install runtime deps only (no dev/test/analysis).
RUN uv sync --no-dev

EXPOSE 8000
CMD ["uv", "run", "--no-dev", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
