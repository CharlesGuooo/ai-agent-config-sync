---
name: repro-pack
description: >-
  Assemble a reproducibility package for an ML/systems paper so a reviewer or
  future-you can re-run the experiments. Use when preparing a code+artifact
  release for submission (NeurIPS/CVPR/ICML/ICLR artifact or reproducibility
  track), packaging results for a thesis chapter, or when the user asks to "make
  this reproducible", "prepare the code release", "repro package", or "what do I
  need to ship for reproducibility". Captures code, configs, exact environment,
  seeds, and results, and emits a REPRODUCE.md + a filled reproducibility
  checklist. Not for general repo cleanup or packaging non-ML software.
metadata:
  category: research
  tags: [reproducibility, ml, artifact, neurips-checklist, release]
---

# Repro Pack (ML reproducibility bundle)

Turn a working experiment directory into a self-contained, re-runnable package.
Reproducibility for ML/systems papers = **code + configs + exact environment +
seeds + the commands that produced each number/figure** — not OSF uploads or
pre-registration (that's a different field's norm).

## Workflow

### 1. Scaffold + capture (script)
```
python scripts/assemble.py --project <experiment-dir> --out <repro-dir>
```
This creates `<repro-dir>/` with:
- `code/` — source copied from the project (excludes `.git`, venvs, `__pycache__`,
  `data/`, `checkpoints/`, `wandb/`, large binaries).
- `configs/` — any `*.yaml/*.yml/*.json/*.toml/*.cfg` configs found.
- `env/` — `requirements.freeze.txt` (`pip freeze`), `python_version.txt`, and a copy
  of `requirements.txt` / `pyproject.toml` / `environment.yml` if present; conda export
  if conda is active.
- `results/` — copied `metrics*.json`, `*.csv`, and key figures (`*.png/*.pdf`) it finds.
- `seeds_found.txt` — every seed-setting call it detected (so none are left implicit).
- `REPRODUCE.md` — a template you then fill in.
- `MANIFEST.txt` + `reproducibility-checklist.md` — inventory + the checklist.

The script copies no raw datasets by default (size/privacy); pass `--include-data`
only for small public sample data. It uses only stdlib + `pip` — no extra installs.

### 2. Fill in REPRODUCE.md (agent + user)
Make every result reproducible by **exact command**. For each table/figure in the
paper, write the literal command that regenerates it, e.g.:
```
## Table 2 (main results)
python code/train.py --config configs/main.yaml --seed 0
# -> writes results/metrics_main.json (Acc 81.3)
```
Specify: data access (download script / DOI / "available on request"), hardware
(GPU model, count, CUDA version), expected runtime, and any non-determinism caveats
(cuDNN nondeterminism, AMP, multi-GPU reduction order).

### 3. Verify the checklist
Go through `reproducibility-checklist.md` (NeurIPS-style) and mark each item. Anything
you cannot check is a reproducibility gap to fix before submission — surface it
explicitly rather than leaving it blank.

## Notes
- Determinism: prefer fixed seeds + logged seeds over "averaged over 3 runs" alone;
  if results are stochastic, report mean±std and the seeds used.
- Environment: `pip freeze` is the floor; pin CUDA/cuDNN/driver in REPRODUCE.md too,
  since ML results are sensitive to them.
- Keep the package buildable from `code/` + `env/` alone on a clean machine — that's
  the test a reviewer applies.
