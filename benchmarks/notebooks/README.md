# benchmarks/notebooks

Jupyter notebooks for analyzing benchmark results and producing the charts that
feed the thesis (brief §13.2).

## `analysis.ipynb`

Reads `benchmarks/results/raw.csv` (produced by
`benchmarks/scripts/run_benchmark.py`) and renders four figures, each exported to
**PNG and PDF** under `benchmarks/results/figures/`:

1. `time_by_algorithm_scale` — mean solve time per algorithm × scale (log).
2. `objective_by_equity_mode` — mean objective value per equity mode.
3. `happiness_by_algorithm` — happiness mean / min / max per algorithm.
4. `rules_satisfied_by_algorithm_scale` — soft-rule satisfaction (%) per
   algorithm × scale.

It also writes a per scale × algorithm summary to `results/analysis_summary.csv`.

### Running it

The plotting stack lives in the optimizer's `analysis` extra (kept out of the
service runtime). From the repo root:

```bash
# 1. Generate the raw metrics (full grid; see scripts/run_benchmark.py --help)
python benchmarks/scripts/run_benchmark.py

# 2. Install the analysis stack and execute the notebook end-to-end
cd benchmarks/notebooks
uv run --project ../../optimizer --extra analysis \
  jupyter nbconvert --to notebook --execute --inplace analysis.ipynb
```

Figures and the summary CSV land in `benchmarks/results/` (git-ignored — they are
regenerated from `raw.csv`, not committed). The notebook is stored without cell
outputs so it stays reproducible and diff-friendly.
