---
name: paper-figures
description: >-
  Makes a paper's matplotlib figures — house style, journal sizing, colorblind and grayscale
  survival, multi-panel layout, export. Claims the whole data-figure territory: there is no
  sibling figure skill to disambiguate against. Use for
  "画个图", "论文配图", "这个柱状图不够 publication", "论文配图风格统一", "figure for the paper",
  "make this figure publication-ready", "Nature figure size", "colorblind-safe palette",
  "multi-panel figure", "export at 600 dpi". Not for conceptual diagrams, architecture
  figures or flowcharts — those are drawn deliberately, by hand or with drawio-skill in
  ~/dev-project/, and an AI-generated architecture figure is a reviewer red flag at
  NeurIPS/ICLR. Not for Plotly/Altair/Bokeh or other interactive and web-first plotting,
  exploratory plots with no publication target, dominant 3D or GIS mapping, or
  Illustrator/Figma-first infographic work.
license: MIT license
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
compatibility: "offline — matplotlib, seaborn, numpy, pandas, scipy, Pillow (see requirements.txt); optional SciencePlots, kaleido, pypdf. No network, no credentials."
metadata:
  category: research
  tags: [matplotlib, figures, publication, palette, journal-compliance, house-style]
  source: >-
    Merged here from two skills that both answered "make me a figure for a paper" and neither
    of which stated a boundary against the other. The house-style layer (references/api.md,
    common-patterns.md, demos.md, design-theory.md, tutorials.md) is vendored verbatim from
    github.com/ChenLiu-1996/figures4papers (3.2k stars, Chen Liu, Yale); upstream ships no
    LICENSE file, and its README documents installing the skill into ~/.claude/skills. The
    journal-compliance layer (references/journal-workflow.md and the other references, plus
    scripts/ and assets/) comes from K-Dense Inc.'s scientific-visualization (MIT), whose
    777-line body was moved wholesale into references/journal-workflow.md so this file could
    become a router. The chart-selection layer (references/chart_selection.md, data_profiling.md,
    viz_pitfalls.md, plot_recipes.md, journal_specs.md, visual_review.md, publication_checklist.md
    and six scripts) is vendored from github.com/Haojae/scipilot-figure-skill (MIT, (c) 2026
    Haojae); its SKILL.md was discarded in the merge because its description is Chinese-only and
    would not have triggered on an English prompt. Nothing was rewritten in any of the three.
---

> **Vendored content.** Two things that only make sense with that context:
>
> - In the house-style references, **"this repository" always means figures4papers upstream**,
>   never this config repo.
> - **`references/api.md` is a specification to implement, not a package to import.** There is
>   no `pip install`, and no module defines `apply_publication_style`, `make_grouped_bar` or
>   `finalize_figure`. Write those helpers into the plotting script you generate, matching the
>   signatures in `api.md`. Do not emit an import for them.

# Paper figures

Three layers, answering three different questions. Read the one the request is actually about;
do not preload all three.

| Layer | The question it answers | Start here |
|---|---|---|
| **Chart choice** | What should it **plot**? Profile the data first, then pick the chart from what the data is — and push back when the requested chart is wrong for it. | [references/chart_selection.md](references/chart_selection.md) |
| **House style** | What should it **look** like? A concrete published-paper look with a fixed semantic palette (`#0F4D92` blue = proposed method, greens = gains, reds = baselines), ultra-wide multi-metric panels, a dedicated legend axis, black bar edges plus hatch. | [references/tutorials.md](references/tutorials.md) |
| **Journal compliance** | What is **allowed**? Nature/Science/Cell column widths, resolution and format, colorblind safety, significance annotation, multi-panel conventions. | [references/journal-workflow.md](references/journal-workflow.md) |

Most requests need all three. Chart choice comes first and is the one people skip: the question
is not "what chart do you want" but **what do you want this figure to convince the reader of**.
When house style and the journal conflict, **the journal wins** — a beautiful figure at the wrong
column width gets sent back.

## Do not plot first

The order is: profile → choose → style → plot at final size → QA → export.

```bash
python scripts/profile_data.py <data>     # what IS this data
python scripts/visual_qa.py <figure.png>  # what is wrong with the render
```

`visual_qa.py` catches deterministically what a description cannot: missing glyphs, clipped text,
overlapping ticks. **Then look at the PNG yourself** — read the rendered image and check the
perceptual things no linter sees: a legend covering data, misaligned subplot labels, whether the
series are still separable in grayscale.

*If your agent cannot read images*, skip the look-at-it step, say so rather than claiming the
figure passed visual review, and fall back to `check_figure.py` plus
[references/publication_checklist.md](references/publication_checklist.md).

[references/viz_pitfalls.md](references/viz_pitfalls.md) carries the hard bans — no mean bars for
n < 10, no pie charts, no dual Y-axis, no rainbow colormaps, no truncated Y axes, no lines
connecting categorical points.

`scripts/README.md` disambiguates the two script lineages; read it before picking between
similarly-named scripts.

## The four rules worth having in context before you open anything

These come up in nearly every figure and are cheap to state, so they live here rather than
behind a pointer.

1. **Plot at final print size.** matplotlib's point sizes are absolute. A 9 pt label in a figure
   later scaled to 50% becomes 4.5 pt on the page, which is a desk-reject in some venues. Set
   `figsize` to the real column width (single column ≈ 3.5 in for most journals) and never
   scale afterwards.
2. **Vector out, never JPEG.** PDF or EPS for submission, 300–600 dpi PNG only where a raster is
   required. JPEG artefacts around text and thin lines are visible at print resolution.
3. **Survive grayscale and colorblindness.** Colour may carry meaning, but never *only* colour —
   add linestyle, marker or hatch so the figure still reads when printed in black and white or
   seen by a reader with deuteranopia.
4. **An error bar without a definition is not evidence.** Every one must state what it is —
   SD, SEM, CI — along with *n*, the test, and any multiple-comparison correction. State it in
   the caption, not only in the methods.

## Reference map

| File | Open when |
|---|---|
| [references/tutorials.md](references/tutorials.md) | End-to-end house-style walkthroughs — bar, trends, heatmap |
| [references/api.md](references/api.md) | Helper signatures, `PALETTE`, validation rules (a spec to implement) |
| [references/common-patterns.md](references/common-patterns.md) | Layout patterns, legend panel, print-safe bars |
| [references/design-theory.md](references/design-theory.md) | Typography, export policy, palette rationale |
| [references/demos.md](references/demos.md) | Canonical `figure_*` demos in figures4papers upstream |
| [references/journal-workflow.md](references/journal-workflow.md) | The full journal-compliance workflow, quick starts and task recipes |
| [references/journal_requirements.md](references/journal_requirements.md) | Per-journal sizing, resolution and format tables |
| [references/publication_guidelines.md](references/publication_guidelines.md) | General publication figure standards |
| [references/color_palettes.md](references/color_palettes.md) | Palette choices and colorblind checking |
| [references/matplotlib_examples.md](references/matplotlib_examples.md) | Worked matplotlib snippets |
| [references/chart_selection.md](references/chart_selection.md) | Which chart fits this data and this claim |
| [references/data_profiling.md](references/data_profiling.md) | What `profile_data.py` reports and how to read it |
| [references/viz_pitfalls.md](references/viz_pitfalls.md) | 18 named pitfalls, and the hard bans |
| [references/plot_recipes.md](references/plot_recipes.md) | Per-chart-type recipes |
| [references/journal_specs.md](references/journal_specs.md) | Per-journal dimension specs (scipilot's table) |
| [references/visual_review.md](references/visual_review.md) | The perceptual checklist for looking at a rendered PNG |
| [references/publication_checklist.md](references/publication_checklist.md) | Pre-submission figure checklist |

## Scripts and assets

```bash
python scripts/style_presets.py     # apply_publication_style(): rcParams per target
python scripts/figure_export.py     # save_publication_figure(): formats, dpi, tight bbox
```

`assets/` holds `publication.mplstyle`, `nature.mplstyle`, `presentation.mplstyle` and
`color_palettes.py`. Load a style file rather than setting rcParams by hand — it is the
difference between a figure that matches its siblings and one that nearly does.

## When not to use this skill

Conceptual diagrams, system architectures and flowcharts are not data plots. Draw them
deliberately — by hand, in drawio (`drawio-skill` in `~/dev-project/`), or in TikZ. Interactive
and web-first plotting (Plotly, Altair, Bokeh), exploratory plots with no publication target,
3D-dominant or GIS work, and Illustrator/Figma-first infographics are all outside this skill.
