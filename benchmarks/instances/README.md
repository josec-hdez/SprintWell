# benchmarks/instances

Fixed, reproducible benchmark instances (JSON) for the SprintWell optimizer
(brief §13.2). Fixing the set — rather than generating on the fly each run —
keeps the experiment auditable and citable in the thesis: same files, same
seeds, comparable results across executions.

## Coverage — 4 scales × 3 equity modes = 12 instances

Each **scale** is generated once (one seed per scale) and emitted in three
variants that differ **only** in `equity_mode`. So for a given scale the three
files describe the *same* problem under utilitarian / max-min / Nash
aggregation — exactly the comparison the benchmark needs (brief §7.4).

| Scale       | users × tasks | days | skills | seed |
| ----------- | ------------- | ---- | ------ | ---- |
| `s1_small`  | 5 × 30        | 14   | 4      | 101  |
| `s2_medium` | 10 × 80       | 18   | 8      | 202  |
| `s3_large`  | 20 × 150      | 18   | 12     | 303  |
| `s4_xl`     | 30 × 200      | 16   | 16     | 404  |

Equity modes: `utilitarian`, `max-min`, `nash`.

File naming: `{scale}_{mode}.json` (e.g. `s2_medium_nash.json`).

All instances use `--rule-density 0.6` and `--conflict-density 0.1`. Sprint
horizons are sized so total task effort fits within `users × days` capacity with
slack, keeping the instances generally satisfiable.

## Regeneration

Instances are produced by the `sprintwell-gen` CLI (see `optimizer/`). From the
`optimizer/` directory:

```bash
for mode in utilitarian max-min nash; do
  uv run sprintwell-gen --users 5  --tasks 30  --days 14 --skills 4  --rule-density 0.6 --conflict-density 0.1 --seed 101 --equity-mode "$mode" --out ../benchmarks/instances/s1_small_$mode.json
  uv run sprintwell-gen --users 10 --tasks 80  --days 18 --skills 8  --rule-density 0.6 --conflict-density 0.1 --seed 202 --equity-mode "$mode" --out ../benchmarks/instances/s2_medium_$mode.json
  uv run sprintwell-gen --users 20 --tasks 150 --days 18 --skills 12 --rule-density 0.6 --conflict-density 0.1 --seed 303 --equity-mode "$mode" --out ../benchmarks/instances/s3_large_$mode.json
  uv run sprintwell-gen --users 30 --tasks 200 --days 16 --skills 16 --rule-density 0.6 --conflict-density 0.1 --seed 404 --equity-mode "$mode" --out ../benchmarks/instances/s4_xl_$mode.json
done
```

Re-running with the same seeds reproduces these files byte-for-byte.
