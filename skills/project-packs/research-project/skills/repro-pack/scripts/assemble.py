#!/usr/bin/env python3
"""Assemble an ML reproducibility package from an experiment directory.

Copies code + configs, snapshots the environment, detects seeds, gathers results,
and writes REPRODUCE.md + MANIFEST + a reproducibility checklist. Stdlib + pip only;
copies no raw datasets unless --include-data.

Usage:
    python assemble.py --project <experiment-dir> --out <repro-dir> [--include-data]
"""
import argparse
import os
import re
import shutil
import subprocess
import sys

CODE_EXT = (".py", ".ipynb", ".sh", ".cu", ".cpp", ".h", ".hpp", ".pyx")
CONFIG_EXT = (".yaml", ".yml", ".json", ".toml", ".cfg", ".ini")
FIG_EXT = (".png", ".pdf", ".svg")
EXCLUDE_DIRS = {".git", "__pycache__", "node_modules", "wandb", "checkpoints",
                "ckpt", "ckpts", "data", "datasets", "outputs", "logs", ".venv",
                "venv", "env", ".idea", ".vscode", "runs"}
SEED_RE = re.compile(
    r"(manual_seed|np\.random\.seed|random\.seed|seed_everything|set_seed|"
    r"torch\.cuda\.manual_seed(_all)?|pl\.seed_everything|\bseed\s*=\s*\d+)", re.I)


def _walk(root):
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for fn in fns:
            yield os.path.join(dp, fn)


def _copy(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    try:
        shutil.copy2(src, dst)
        return True
    except Exception as e:
        sys.stderr.write(f"  skip {src}: {e}\n")
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--include-data", action="store_true")
    args = ap.parse_args()

    proj = os.path.abspath(os.path.expanduser(args.project))
    out = os.path.abspath(os.path.expanduser(args.out))
    if not os.path.isdir(proj):
        sys.exit(f"project dir not found: {proj}")
    os.makedirs(out, exist_ok=True)
    manifest, seeds = [], []
    n_code = n_cfg = n_res = 0

    for path in _walk(proj):
        rel = os.path.relpath(path, proj)
        ext = os.path.splitext(path)[1].lower()
        base = os.path.basename(path).lower()
        dest = None
        if ext in CODE_EXT:
            dest = os.path.join(out, "code", rel); n_code += 1
        elif base.startswith("metrics") or ext == ".csv":
            dest = os.path.join(out, "results", os.path.basename(path)); n_res += 1
        elif ext in FIG_EXT:
            dest = os.path.join(out, "results", "figures", os.path.basename(path)); n_res += 1
        elif ext in CONFIG_EXT:
            dest = os.path.join(out, "configs", os.path.basename(path)); n_cfg += 1
        if dest and _copy(path, dest):
            manifest.append(os.path.relpath(dest, out))
        # seed detection on code
        if ext == ".py":
            try:
                for i, line in enumerate(open(path, encoding="utf-8", errors="ignore"), 1):
                    if SEED_RE.search(line):
                        seeds.append(f"{rel}:{i}: {line.strip()[:120]}")
            except Exception:
                pass

    # environment snapshot
    envdir = os.path.join(out, "env"); os.makedirs(envdir, exist_ok=True)
    with open(os.path.join(envdir, "python_version.txt"), "w") as fh:
        fh.write(sys.version + "\n")
    try:
        fr = subprocess.run([sys.executable, "-m", "pip", "freeze"],
                            capture_output=True, text=True, timeout=120)
        open(os.path.join(envdir, "requirements.freeze.txt"), "w").write(fr.stdout)
    except Exception as e:
        sys.stderr.write(f"  pip freeze failed: {e}\n")
    for fn in ("requirements.txt", "pyproject.toml", "environment.yml", "setup.py"):
        p = os.path.join(proj, fn)
        if os.path.exists(p):
            _copy(p, os.path.join(envdir, fn))
    if os.environ.get("CONDA_PREFIX"):
        try:
            ce = subprocess.run(["conda", "env", "export"], capture_output=True,
                                text=True, timeout=120)
            if ce.returncode == 0:
                open(os.path.join(envdir, "conda-environment.yml"), "w").write(ce.stdout)
        except Exception:
            pass

    open(os.path.join(out, "seeds_found.txt"), "w", encoding="utf-8").write(
        "\n".join(seeds) or "(no explicit seed-setting calls found — add them!)\n")

    # checklist + REPRODUCE template
    open(os.path.join(out, "reproducibility-checklist.md"), "w", encoding="utf-8").write(CHECKLIST)
    open(os.path.join(out, "REPRODUCE.md"), "w", encoding="utf-8").write(
        REPRODUCE_TMPL.format(project=os.path.basename(proj)))
    open(os.path.join(out, "MANIFEST.txt"), "w", encoding="utf-8").write(
        "\n".join(sorted(manifest)) + "\n")

    print(f"repro package -> {out}")
    print(f"  code files: {n_code}  configs: {n_cfg}  result/figure files: {n_res}")
    print(f"  seeds detected: {len(seeds)}  (see seeds_found.txt)")
    if not args.include_data:
        print("  NOTE: raw datasets NOT copied (use --include-data for small public samples).")
    print("Next: fill REPRODUCE.md with exact per-result commands + hardware, then walk the checklist.")


CHECKLIST = """# Reproducibility checklist (NeurIPS-style)

## Code & instructions
- [ ] All training/eval code included and runnable from `code/`
- [ ] Exact command for every reported number/figure (in REPRODUCE.md)
- [ ] Configs for all reported runs in `configs/`

## Data
- [ ] Data access documented (download script / DOI / license / "on request")
- [ ] Preprocessing scripts included and deterministic
- [ ] Train/val/test splits specified (and split code/seed provided)

## Environment
- [ ] `env/requirements.freeze.txt` present
- [ ] Python version recorded; CUDA / cuDNN / driver versions in REPRODUCE.md
- [ ] Hardware (GPU model, count, memory) documented

## Experiments
- [ ] Seeds fixed and logged (`seeds_found.txt`); stochastic results report mean +/- std
- [ ] Hyperparameters fully specified (no "tuned by hand" gaps)
- [ ] Compute budget / expected runtime per experiment stated
- [ ] Known sources of nondeterminism noted (cuDNN, AMP, multi-GPU reduction)

## Results
- [ ] Raw `metrics*.json` / logs included in `results/`
- [ ] Figures regenerable from included code + results
"""

REPRODUCE_TMPL = """# Reproducing: {project}

## Environment
- Python: see `env/python_version.txt`
- Install: `pip install -r env/requirements.freeze.txt`  (or `env/requirements.txt`)
- Hardware: <GPU model x count, RAM>  |  CUDA <ver>  cuDNN <ver>  driver <ver>
- Expected total runtime: <fill>

## Data
- Source / download: <script or DOI or link>
- Preprocessing: `python code/<prep>.py ...`

## Reproduce each result
<!-- one block per table/figure, with the EXACT command -->
### Table 1 / Figure 1 (<name>)
```
python code/<train>.py --config configs/<cfg>.yaml --seed 0
# -> results/<metrics>.json  (<metric> = <value>)
```

## Notes / caveats
- Nondeterminism: <e.g. cuDNN benchmark on; AMP; multi-GPU all-reduce order>
- Seeds used: see `seeds_found.txt`
"""

if __name__ == "__main__":
    main()
