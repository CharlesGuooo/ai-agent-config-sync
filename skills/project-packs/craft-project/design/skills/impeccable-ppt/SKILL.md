---
name: impeccable-ppt
description: >-
  Use when the visual craft or aesthetics of a slide deck / PowerPoint / 演示文稿 /
  答辩PPT / presentation matter — making slides look designed and human rather than
  AI-generated or template-default. Covers slide typography, color, layout, spacing,
  hierarchy, figure placement, build/transition restraint, and de-templating.
  This is the TASTE-AND-POLISH layer, not a deck generator: run it AFTER the content
  exists (drafted by scientific-slides, nature-paper2ppt, ppt-master, or a hand-made
  .pptx) to critique and refine the look. Triggers on: "make these slides look better /
  less template / less AI", "幻灯片好丑 / 太模板 / 一看就是AI做的", "答辩PPT美化 / 排版 /
  配色 / 字体", "polish my deck", "slide design review", "这页排版怎么改". Also use as a
  design checklist before presenting. NOT for writing slide content/narrative (use
  scientific-slides) or generating the .pptx from a paper (use nature-paper2ppt / ppt-master),
  and NOT for web/app UI (use the original impeccable for that).
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
compatibility: "offline — design guidance only; no bundled scripts, no network, no credentials (uses whatever deck tooling is already installed)"
license: Apache-2.0
source: https://github.com/pbakaus/impeccable
---

# Impeccable for Slides

Aesthetic craft for presentation decks. Adapted from **Impeccable** (Paul Bakaus,
Apache-2.0), re-targeted from frontend UI to slides / PPT / Beamer — especially
thesis-defense decks. It does not generate slides; it makes an existing deck look
*designed and human* instead of *template-default and AI-made*.

**Where it sits:** `scientific-slides` decides the story/structure; `nature-paper2ppt`
or `ppt-master` produce the `.pptx`; **this skill is the taste + polish pass on top.**
Point it at a drafted deck (or a single slide) and iterate.

## The one test that matters

**The AI-slop test:** if someone glancing at the deck could say "a tool made that"
without doubt, it failed. The default PowerPoint look — Title + bullet list, Calibri,
one accent color, a logo in the corner, the same layout on every slide — *is* that
tool-made look. Every rule below exists to break it.

**The projector caveat (slides are not screens):** a deck is judged from the back of
a room, on a washed-out beamer, in 10-second glances. Contrast, type size, and one-idea
clarity matter more here than in any UI. Verify at *presentation scale*, not on your laptop.

## Absolute bans — match and rewrite

If a slide is about to contain any of these, restructure it instead:

- **The bullet-list default.** A title over 4–6 dashes is the template reflex, not
  design. Prefer: one assertion as the headline + one supporting visual; a 2–3 column
  contrast; a diagram; a single number with context. Bullets only for genuinely parallel,
  scannable items — and then ≤4, one line each.
- **Wall of text.** If a slide can be read aloud verbatim, it's a script, not a slide.
  The audience reads OR listens, never both. Move prose to speaker notes.
- **Every slide the same layout.** Title-top / content-middle on all 30 slides is
  monotony. Vary: full-bleed figure slides, section dividers, one-word emphasis slides,
  quote slides. Rhythm is a design tool.
- **Decorative everything.** Drop shadows on every box, gradient fills, gradient text,
  3-D bevels, WordArt, clip-art, emoji as decoration, stock "business handshake" photos.
  Purposeful or gone.
- **3-D / rainbow / pie charts.** 3-D bars distort values; rainbow colormaps mislead;
  pies hide differences. Use the figure tooling (`scipilot-figure-skill`) and flat 2-D.
- **Chart-junk carried from Excel.** Default gridlines, legend boxes, background fills,
  redundant axis titles. Strip to the data + minimal reference lines.
- **Text/figures overflowing the safe area.** Content touching slide edges reads as
  cramped and gets cut by some projectors. Keep a consistent margin (safe area) on all four sides.
- **Laser-pointer eyebrows.** Tiny tracked ALL-CAPS kickers ("BACKGROUND", "METHOD")
  above every title — the deck equivalent of the AI eyebrow. Let the section divider carry it.

## Color

- **Contrast, then everything else.** Body/label text ≥ 4.5:1 against its background;
  large text ≥ 3:1 — and stricter in practice because projectors wash out. The #1 failure
  is elegant light-gray text on white/tinted-white: illegible from row 5. Push text toward
  ink. Light gray "for elegance" is the single biggest reason a deck looks amateur.
- **No gray text on a colored fill** — it looks muddy. Use a darker shade of the fill's own
  hue, or a transparency of the text color.
- **Commit to a strategy, don't sprinkle.** Pick one: *Restrained* (near-neutral bg + one
  accent ≤10% of the surface — the safe default for data-forward defense decks) or
  *Committed* (one saturated brand color carries section dividers / title slide). Avoid the
  timid middle where three weak tints fight.
- **Colorblind-safe + redundant encoding** in every figure and callout: never color alone —
  pair with shape, label, or position. ~8% of a committee can't separate red/green.
- **One decision up front:** bright lecture hall or dark room? Light background + dark ink
  survives ambient light and prints; reserve dark backgrounds for genuinely dark rooms with
  a bright projector. Not "dark because it looks cool."

## Typography

- **Kill muddy hierarchy.** 24 / 28 / 32pt on one slide reads as one flat size. Use **fewer
  sizes with more contrast** — a 4-tier scale (title / headline / body / caption) at ratio
  ≥ 1.25, and commit to it across the deck.
- **Minimum sizes for projection:** body/labels ≥ 24pt, never below 18pt for anything the
  audience must read; axis tick labels in figures ≥ 18pt effective. If it doesn't fit at
  that size, the slide has too much on it — cut, don't shrink.
- **Escape the defaults.** Calibri / Arial / Times default = invisible/template. Choose a
  deliberate family; if pairing, pair on a *contrast axis* (serif + sans, geometric + humanist),
  never two similar sans. One strong family in 2–3 weights beats two competing fonts.
- **≤ 3 weights, roles fixed** (e.g. Bold = title, Semibold = headline, Regular = body).
  Consistency across slides is the craft.
- **ALL-CAPS needs tracking** (+5–12% letter-spacing) or the caps jam together.
- **tabular / lining figures** for any numbers that should align (results tables, metrics).

## Layout & hierarchy

- **One idea per slide.** The headline states the takeaway; everything else supports that
  one claim. If a slide has two messages, it's two slides.
- **Squint test.** Blur your eyes (or shrink the slide to a thumbnail): can you still tell
  the single most important element and the groupings? If not, hierarchy is missing — fix
  with **space and weight first**, color/size only if needed.
- **Space is the tool.** Use one spacing scale (4-pt base: 4/8/12/16/24/32/48). **Tight
  grouping** for related items (8–12pt), **generous separation** between distinct blocks
  (40–80pt). Equal spacing everywhere = no rhythm.
- **Align to a grid, honor a safe margin.** Nothing at arbitrary positions; edges line up;
  consistent margins frame every slide. Optical alignment beats geometric when they disagree.
- **Combine 2–3 hierarchy dimensions** for the primary element (bigger + bolder + more space
  above), not size alone. Strong = ≥3:1 size ratio, bold-vs-regular, surrounded by whitespace.
- **Figure-forward for a defense.** Your results figures are the argument. Give the key figure
  a full slide, legible from the back, with a one-line takeaway headline — not a caption buried
  under bullets. Regenerate under-sized/low-contrast figures with `scipilot-figure-skill`.

## Motion (build & transitions)

- **Restraint.** Slide transitions: a single subtle fade or none. No fly-in, spin, cube,
  checkerboard — those read as amateur instantly.
- **Builds only to manage attention** (reveal one row of a table as you discuss it), never as
  decoration, and never as the only way information appears — the slide must still make sense
  static (for the printed thesis appendix, the handout, and if the animation fails on the venue's machine).

## Register: thesis-defense deck

- **Title slide:** thesis title, your name, supervisor/committee, department, date — clean,
  one accent, no clip-art. It sets the whole deck's visual tone; make it deliberate.
- **Arc:** motivation → gap → contribution(s) → method → results (figure-forward) → limitations
  → conclusion → (backup slides). `scientific-slides` owns this arc; this skill makes each beat *look* right.
- **Backup slides** after the conclusion for anticipated committee questions (extra results,
  derivations, ablations) — same visual system, clearly marked "Backup".
- **One visual system throughout:** same palette, type scale, margins, and figure style on
  every slide. Coherence is most of what "polished" means.

## Process — how to run this skill

1. **Inspect at presentation scale.** If a tool renders slides to images, read them back and
   judge them; a thumbnail grid surfaces monotony and misalignment fast. Otherwise reason from
   the deck source. A slide you didn't actually look at doesn't count.
2. **Critique honestly** against the AI-slop test, the absolute bans, and the color/type/layout
   rules above. Cite the specific slide and element — never a bare "looks fine". Don't invent
   defects to look thorough; a confident "this slide is clean" is a valid finding.
3. **Fix structure, not surface.** Most "ugly" slides are a hierarchy/spacing problem, not a
   color problem. Restructure the slide; recolor last.
4. **Re-inspect** the changed slides. Exit bar: would this deck be defensible in front of a
   design-literate committee, legible from the back row, and impossible to dismiss as "a tool made it"?

Report which slides you changed and the most important fixes, in the deck's own terms.
