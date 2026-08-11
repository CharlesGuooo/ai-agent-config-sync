---
name: scientific-figure-making
description: >-
  Build matplotlib figures in the figures4papers house style — a concrete published-paper look
  with a fixed semantic palette (#0F4D92 blue = proposed method, greens = gains, reds = baselines),
  ultra-wide multi-metric panels, a dedicated legend axis, black bar edges + hatch so bars survive
  grayscale print, tight_layout(pad=2), dpi 300/600 — plus links to the real plot_*.py scripts
  behind NeurIPS / ICML / ECCV / Nature Machine Intelligence figures. Use when the figure should
  LOOK like those papers, or the user says "照着 figures4papers 的风格" / "论文配图风格统一" /
  "这个柱状图不够 publication" / "match the repo figure style". Distinct from
  scientific-visualization, which encodes journal compliance (Nature/Science/Cell sizing,
  significance markers, colorblind checks) — that one says what is ALLOWED; and from
  scipilot-figure-skill, a chart-type advisor (which chart fits the claim, CJK fonts, pitfall
  interception) — that one says what to PLOT. This one says what it should LOOK like and hands
  you reference code. Do not use for Plotly/Altair/Bokeh or other interactive/web viz,
  exploratory-only plots with no publication target, dominant 3D or GIS mapping, or
  Illustrator/Figma-first infographic work.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
metadata:
  category: research
  tags: [matplotlib, figures, publication, palette, house-style]
  source: >-
    Body and references/ vendored verbatim from github.com/ChenLiu-1996/figures4papers
    (path scientific-figure-making/, 3.2k stars, by Chen Liu, Yale). Scanned with skill-scanner:
    0 findings, 0 untrusted URLs, no scripts. Upstream ships NO LICENSE file; its README
    explicitly documents installing this skill into ~/.claude/skills. Frontmatter adapted here:
    allowed-tools added, Chinese triggers added, boundaries against the two sibling figure
    skills stated.
---

> **Vendored skill.** The body below and everything in `references/` is copied verbatim from
> [ChenLiu-1996/figures4papers](https://github.com/ChenLiu-1996/figures4papers) →
> `scientific-figure-making/`. Two things that only make sense with that context:
>
> - **"this repository" always means figures4papers upstream**, never this config repo.
> - **`references/api.md` is a specification to implement, not a package to import.** There is
>   no `pip install`, and no module defines `apply_publication_style`, `make_grouped_bar`, or
>   `finalize_figure`. Write those helpers into the plotting script you generate, matching the
>   signatures in `api.md`. Do not emit an import for them.

# Scientific figure making

Open `references/` only as needed; do not preload every file. Start from the table below, then follow links inside the document you opened (and into `figure_*` code via [references/demos.md](references/demos.md)) instead of loading the full reference set up front.

## When to load this skill

- Matplotlib figures for **papers, slides, or reports** that must match **this repo’s publication look** (fonts, palette, spines, legends, export).
- Requests involving **grouped bars, trend lines, heatmaps, multi-panel grids**, or **PDF/SVG/high-DPI** output in a scientific-figure context.
- References to **figures4papers** `figure_*` projects or “same style as the repo figures.”

## When not to load

- **Plotly, Altair, Bokeh**, or other interactive / web-first plotting.
- **EDA-only** plots where seaborn or pandas is enough until there is a publication target.
- Primary workflow is **3D, GIS**, or **non-matplotlib** tooling.
- **Illustrator / Figma–first** layout or infographic (not matplotlib data plots).

## Related files

| File | Open when |
|------|-----------|
| [references/tutorials.md](references/tutorials.md) | End-to-end walkthroughs (bar, trends, heatmap) |
| [references/api.md](references/api.md) | Function signatures, `PALETTE`, validation rules |
| [references/common-patterns.md](references/common-patterns.md) | Layout patterns, legend panel, print-safe bars |
| [references/design-theory.md](references/design-theory.md) | Typography, export policy, palette rationale |
| [references/demos.md](references/demos.md) | Canonical `figure_*` demo links in figures4papers |
