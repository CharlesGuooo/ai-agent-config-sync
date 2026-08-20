# Module: Compile

**Trigger**: compile, 编译, build, 生成 PDF, 编译报错, rebuild the pdf, pdflatex, xelatex

**Default Behavior**: Uses `latexmk`, which handles all dependencies (bibtex/biber, cross-references, indexes) and works out how many passes are needed.

**If no TeX distribution is installed**, the script selects `tectonic` instead — a single self-contained binary that fetches the packages a document needs, runs the passes and BibTeX itself, and works offline afterwards. This is not a degraded fallback; on a machine with no TeX Live or MiKTeX it is the only engine that runs. See [../tectonic.md](../tectonic.md).

**On failure**, the script parses `<main>.log` and prints the likely causes with source line numbers rather than leaving you to read the log. This works for every engine here.

**Tools** (matching VS Code LaTeX Workshop):
| Tool | Command | Args |
|------|---------|------|
| tectonic | `tectonic` | `-X compile --keep-logs --synctex` |
| xelatex | `xelatex` | `-synctex=1 -interaction=nonstopmode -file-line-error` |
| pdflatex | `pdflatex` | `-synctex=1 -interaction=nonstopmode -file-line-error` |
| latexmk | `latexmk` | `-synctex=1 -interaction=nonstopmode -file-line-error -pdf -outdir=%OUTDIR%` |
| bibtex | `bibtex` | `%DOCFILE%` |
| biber | `biber` | `%DOCFILE%` |

**Recipes**:
| Recipe | Steps | Use Case |
|--------|-------|----------|
| latexmk | latexmk (auto) | **DEFAULT where a TeX distribution exists** - auto-handles all dependencies |
| tectonic | tectonic (auto) | **DEFAULT where none does** - self-contained, no TeX distribution, offline after first run |
| PDFLaTeX | pdflatex | Quick single-pass build |
| XeLaTeX | xelatex | Quick single-pass build |
| pdflatex -> bibtex -> pdflatex*2 | pdflatex → bibtex → pdflatex → pdflatex | Traditional BibTeX workflow |
| pdflatex -> biber -> pdflatex*2 | pdflatex → biber → pdflatex → pdflatex | Modern biblatex (recommended for new projects) |
| xelatex -> bibtex -> xelatex*2 | xelatex → bibtex → xelatex → xelatex | Chinese/Unicode + BibTeX |
| xelatex -> biber -> xelatex*2 | xelatex → biber → xelatex → xelatex | Chinese/Unicode + biblatex |

**Usage**:
```bash
# Default: latexmk where available, tectonic where not — no flag needed
uv run python -B scripts/compile.py main.tex                          # Auto-detect engine
uv run python -B scripts/compile.py main.tex --recipe tectonic        # Force tectonic

# Single-pass compilation (quick builds)
uv run python -B scripts/compile.py main.tex --recipe pdflatex        # PDFLaTeX only
uv run python -B scripts/compile.py main.tex --recipe xelatex         # XeLaTeX only

# Explicit bibliography workflows (when you need control)
uv run python -B scripts/compile.py main.tex --recipe pdflatex-bibtex # Traditional BibTeX
uv run python -B scripts/compile.py main.tex --recipe pdflatex-biber  # Modern biblatex (recommended)
uv run python -B scripts/compile.py main.tex --recipe xelatex-bibtex  # XeLaTeX + BibTeX
uv run python -B scripts/compile.py main.tex --recipe xelatex-biber   # XeLaTeX + biblatex

# With output directory
uv run python -B scripts/compile.py main.tex --outdir build

# Force detected-compiler biber workflow
uv run python -B scripts/compile.py main.tex --biber

# Utilities
uv run python -B scripts/compile.py main.tex --watch                  # Watch mode
uv run python -B scripts/compile.py main.tex --clean                  # Clean aux files
uv run python -B scripts/compile.py main.tex --clean-all              # Clean all (incl. PDF)
```

**Auto-detection**: Script detects Chinese content (ctex, xeCJK, Chinese chars) and auto-selects xelatex.

