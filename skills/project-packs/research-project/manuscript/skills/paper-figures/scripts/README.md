# Which script does what

Two lineages live here, merged from skills that each owned part of the job. They are
complementary, not alternatives, but two of the names mirror each other — read this before
picking one.

| Script | From | Use it for |
|---|---|---|
| `profile_data.py` | scipilot | **Run first.** Profiles the data so the chart type is chosen from what the data is, not from habit. |
| `setup_style.py` | scipilot | Style setup **with CJK font handling** (`list_cjk_fonts`, `configure_chinese_fonts`) and optional SciencePlots. Use when the figure has Chinese labels. |
| `style_presets.py` | scientific-visualization | Style setup by **journal target** — `configure_for_journal('nature', 'single')`, palette selection, `.mplstyle` generation. Use when the venue dictates the look. |
| `layout_tools.py` | scipilot | Multi-panel layout, panel labels, alignment. |
| `visual_qa.py` | scipilot | **The closed loop.** Renders a PNG and audits it — missing glyphs, clipped text, overlapping ticks. Then look at the PNG yourself with `Read`. |
| `check_figure.py` | scipilot | Static checks against the publication checklist. |
| `export_figure.py` | scipilot | Export **with a grayscale proof** — the variant that tells you whether the figure survives black-and-white print. |
| `figure_export.py` | scientific-visualization | Export by journal spec — `save_for_journal()`, size verification, font-embedding check for PDF. |

Rule of thumb: **scipilot's scripts decide and check; the other two conform to a venue.**
Profile, choose, style, plot, QA, then export.
