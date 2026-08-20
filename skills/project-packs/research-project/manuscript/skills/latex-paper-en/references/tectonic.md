# Tectonic engine

Tectonic is a self-contained LaTeX engine: one binary, no TeX distribution. It downloads the
packages and fonts a document actually needs on first run, caches them, and works offline after
that. It runs multiple passes and BibTeX itself, so there is no separate `bibtex` step.

`scripts/compile.py` selects it automatically when `latexmk` is absent, and it can be forced:

```bash
uv run python -B scripts/compile.py main.tex --recipe tectonic
uv run python -B scripts/compile.py main.tex --recipe tectonic --outdir build
```

Install: `winget install TectonicProject.Tectonic`, or see
<https://tectonic-typesetting.github.io/>.

**When to prefer it over latexmk.** Any machine without TeX Live or MiKTeX — Tectonic is then the
only engine that will run at all. Also useful for a reproducibility package, since a reviewer needs
one binary rather than a 5 GB distribution, and `repro-pack` can name the exact version.

**When latexmk is still the right choice.** A venue whose template depends on a package Tectonic's
bundle does not carry; a build that shells out (`--shell-escape`, `minted`, `gnuplot`); anything
needing `biber` with a biblatex style the bundle lacks.

## Failure modes

### First run and network
- **Slow first run, "downloading" messages** — Tectonic is fetching its bundle. Expected, needs
  network, once only. The cache lives at `%LOCALAPPDATA%\TectonicProject\Tectonic` on Windows and
  `~/.cache/Tectonic` elsewhere.
- **`connection / network error`** — check network and proxy. After one successful fetch the same
  document builds offline.

### Bibliography and citations
- **`errors were issued by BibTeX, but were ignored`** — normal while a `.bib` is still a
  placeholder or a section has no `\cite` yet. Not fatal. It disappears once real entries are cited.
- **`Citation 'key' undefined`** — the key is absent from the `.bib`, or misspelled.
- **Bibliography missing, or citations render as `[?]`** — Tectonic already runs the passes, so
  this is not a "run bibtex again" problem. Check that `\bibliography{...}` points at the right
  path and that `\bibliographystyle{...}` is present. Recompile; no manual `bibtex` call.

### Hard errors
- **`! Undefined control sequence`** — an undefined command: a misspelled macro, or a missing
  `\usepackage`. The log's `l.NNN` gives the source line, and `compile.py` surfaces it.
- **`! LaTeX Error: File 'xxx.sty' not found`** — Tectonic usually fetches packages on demand, so
  this normally means the name is wrong, or the file is a local `.sty` whose path does not resolve
  relative to the main file.
- **`! Missing $ inserted`** — a math symbol (`_`, `^`, `\alpha`) appears in text without `$...$`.
- **`! Missing } inserted` / `Runaway argument`** — unbalanced braces, usually a `\command{...}`
  missing its closing brace.
- **`! Package inputenc/fontenc Error`** — rare under Tectonic, which is UTF-8 and XeTeX-based by
  default. Porting a pdflatex template? Drop `\usepackage[utf8]{inputenc}`.
- **`Undefined reference 'fig:xxx'`** — `\ref` and `\label` disagree. Fix and recompile once.

### Figures
- **Image not found** — `\includegraphics` paths are relative to the main file. Keep figures in
  `figures/`; prefer PDF or PNG.
- **`Overfull \hbox`** — a long URL, formula or table overflows the text block. Not fatal. Fix with
  `\sloppy`, a manual break, or a narrower graphic.

## Last resort

Delete the intermediates (`.aux`, `.bbl`, `.toc`) and rebuild. If the cause is still unclear, run
with `--keep-logs` and read the final ~30 lines of `<main>.log` — `compile.py` prints its path on
every failure.
