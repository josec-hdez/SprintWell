#!/usr/bin/env python3
"""Run the SprintWell benchmark grid and dump raw metrics to CSV (issue #91).

Sweeps the fixed instances (benchmarks/instances/) × algorithms × equity modes ×
seeds and records, per run, the metrics of brief §13.2. Each run goes through the
optimizer CLI (``sprintwell-solve solve``) as a subprocess — never the backend —
so measurement is isolated. The reported time is the solver's own
``wall_time_ms`` (not process startup), keeping it comparable across runs.

The full grid is 12 instances × 3 algorithms × 3 equity modes × 10 seeds = 1080
runs, executable with a single command:

    python benchmarks/scripts/run_benchmark.py

Reproducibility comes from the documented seeds (0..N-1). The committed
``results/raw.csv`` is a small SAMPLE (see --help flags); a full sweep with the
default 30 s budget takes hours and is meant to be run by the researcher.
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INSTANCES = REPO_ROOT / "benchmarks" / "instances"
DEFAULT_OPTIMIZER = REPO_ROOT / "optimizer"
DEFAULT_OUT = REPO_ROOT / "benchmarks" / "results" / "raw.csv"

ALGORITHMS = ("cpsat", "random", "greedy")
EQUITY_MODES = ("utilitarian", "max-min", "nash")

FIELDNAMES = [
    "instance",
    "scale",
    "algorithm",
    "equity_mode",
    "seed",
    "status",
    "objective_value",
    "wall_time_ms",
    "happiness_mean",
    "happiness_min",
    "happiness_max",
    "rules_satisfied_pct",
    "deadlines_met_pct",
    "n_users",
    "n_tasks",
]


def _run_cli(
    *, optimizer_dir: Path, instance: Path, algorithm: str, equity_mode: str, seed: int, time_budget: float
) -> dict[str, object]:
    """Invoke the optimizer CLI for one configuration; return the SolverOutput dict."""
    command = [
        "uv", "run", "--project", str(optimizer_dir), "sprintwell-solve", "solve",
        "--input", str(instance), "--out", "-", "--quiet",
        "--algorithm", algorithm, "--equity-mode", equity_mode,
        "--seed", str(seed), "--time-budget", str(time_budget),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode not in (0, 1):  # 0=OK, 1=INFEASIBLE/TIMEOUT (both valid output)
        raise RuntimeError(f"CLI failed (rc={result.returncode}): {result.stderr.strip()}")
    return json.loads(result.stdout)


def _happiness(output: dict[str, object]) -> tuple[float | str, float | str, float | str]:
    scores = [entry["f_j"] for entry in output.get("per_user_happiness", [])]
    if not scores:
        return "", "", ""
    return sum(scores) / len(scores), min(scores), max(scores)


def _rules_satisfied_pct(output: dict[str, object]) -> float | str:
    evaluations = output.get("rule_evaluations", [])
    if not evaluations:
        return ""
    return 100.0 * sum(e["satisfied"] for e in evaluations) / len(evaluations)


def _deadlines_met_pct(instance: dict[str, object], output: dict[str, object]) -> float | str:
    effort_by_task = {t["id"]: t["effort_days"] for t in instance["tasks"]}
    deadline_by_task = {
        t["id"]: t["deadline_day"] for t in instance["tasks"] if t.get("deadline_day") is not None
    }
    if not deadline_by_task:
        return ""
    start_by_task = {a["task_id"]: a["start_day"] for a in output.get("assignments", [])}
    met = 0
    for task_id, deadline in deadline_by_task.items():
        start = start_by_task.get(task_id)
        if start is not None and start + effort_by_task[task_id] <= deadline + 1:
            met += 1
    return 100.0 * met / len(deadline_by_task)


def run(args: argparse.Namespace) -> int:
    instance_paths = sorted(Path(args.instances_dir).glob("*.json"))
    if args.limit_instances is not None:
        instance_paths = instance_paths[: args.limit_instances]
    if not instance_paths:
        print(f"error: no instances in {args.instances_dir}", file=sys.stderr)
        return 1

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    seeds = list(range(args.seeds))
    total = len(instance_paths) * len(ALGORITHMS) * len(EQUITY_MODES) * len(seeds)
    done = 0

    with out_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        for instance_path in instance_paths:
            instance = json.loads(instance_path.read_text(encoding="utf-8"))
            scale = instance_path.stem.rsplit("_", 1)[0]
            for algorithm in ALGORITHMS:
                for equity_mode in EQUITY_MODES:
                    for seed in seeds:
                        output = _run_cli(
                            optimizer_dir=Path(args.optimizer_dir),
                            instance=instance_path,
                            algorithm=algorithm,
                            equity_mode=equity_mode,
                            seed=seed,
                            time_budget=args.time_budget,
                        )
                        mean, lo, hi = _happiness(output)
                        writer.writerow(
                            {
                                "instance": instance_path.name,
                                "scale": scale,
                                "algorithm": algorithm,
                                "equity_mode": equity_mode,
                                "seed": seed,
                                "status": output["status"],
                                "objective_value": output["objective_value"],
                                "wall_time_ms": output["solver_stats"]["wall_time_ms"],
                                "happiness_mean": mean,
                                "happiness_min": lo,
                                "happiness_max": hi,
                                "rules_satisfied_pct": _rules_satisfied_pct(output),
                                "deadlines_met_pct": _deadlines_met_pct(instance, output),
                                "n_users": len(instance["users"]),
                                "n_tasks": len(instance["tasks"]),
                            }
                        )
                        done += 1
                        print(f"\r{done}/{total} runs", end="", file=sys.stderr, flush=True)
    print(f"\nWrote {done} rows to {out_path}", file=sys.stderr)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the SprintWell benchmark grid.")
    parser.add_argument("--instances-dir", default=str(DEFAULT_INSTANCES))
    parser.add_argument("--optimizer-dir", default=str(DEFAULT_OPTIMIZER))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--seeds", type=int, default=10, help="Number of seeds (0..N-1).")
    parser.add_argument("--time-budget", type=float, default=30.0, help="Per-run budget (s).")
    parser.add_argument(
        "--limit-instances", type=int, default=None, help="Use only the first N instances (sampling)."
    )
    return run(parser.parse_args(argv))


if __name__ == "__main__":
    raise SystemExit(main())
