---
name: resume-writing
description: >-
  Use when writing, rewriting, or tailoring a resume or academic CV kept as LaTeX source in a
  repository: one shared class file, one .tex per target, a master profile of facts, compiled
  with Tectonic or another TeX engine. Triggers on requests to draft or update a resume/CV,
  tailor it to a job description or a PhD/RA program, add or rephrase bullets, or compile it
  to PDF. Enforces CAR bullets, no fabrication, the industry-vs-academic split, and a page
  fill verified on the compiled PDF.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
compatibility: "local-tools — needs a TeX engine (Tectonic recommended; it fetches its own packages on first run); no credentials"
---

# Resume Writing (LaTeX, industry resume + academic CV)

This skill works on a resume repository the user supplies. It expects roughly this shape and
adapts to whatever the repo actually contains:

- **A master profile** (for example `PROFILE.md`): the **only** allowed source of facts. Roles,
  employers, dates, titles, metrics, publications, and pre-written bullet variants live here.
- **A shared class file** (for example `resume.cls`) that holds all formatting.
- **One `.tex` per target**: a 1-page industry resume per role family, a multi-page academic CV,
  and so on. Each is `\documentclass{<class>}` plus content only.
- Optional notes: what each variant leads with or omits, tailoring notes, and a smoke-test `.tex`
  that exercises every macro of the class.

## Step 0: learn the layout before writing anything
1. If the user has not described the layout, detect it: `Glob` for `**/*.cls`, `**/*.tex`, and a
   facts file (`PROFILE.md`, `profile.*`, `facts.md`, `background*.md`). Grep the `.tex` files for
   `\documentclass` to see which class each uses, and read the repo README for house rules.
2. Confirm with the user: where the facts live, which `.tex` serves which target, which engine and
   command compile them, and where the PDFs go.
3. If there is no master profile yet, offer to build one from the existing `.tex`/PDF plus the
   user's answers before tailoring anything. **If a fact, metric, date, or title is not in the
   profile, ask the user. Never invent it.**

## Method

### CAR bullets
Every experience or project bullet is Challenge · Action · Result (STAR is equivalent).
- Assembled form: **[Result/impact] by [Action] [that addressed the Challenge], achieving [metric].**
- Lead with a strong action verb. One idea per bullet, 1–2 lines.
- Put a number in the result whenever a real one exists (%, ×, latency, dataset size, accuracy,
  count). If none exists, state the concrete qualitative outcome. Never invent a metric.
- Past tense for finished work, present tense only for ongoing roles. No first-person pronouns.
- Audit each bullet: does it have a Result? If not, can a credible metric come from the profile?

### Industry resume vs academic CV
| Dimension | Industry resume | Academic CV |
| --- | --- | --- |
| Audience | Recruiter + ATS + hiring manager (skims in ~10 s) | Professor / admissions / supervisor (reads closely) |
| Length | **1 page** (hard limit early in a career) | 1–2+ pages; a CV has no length cap |
| Top emphasis | Skills + impact in industry-relevant work | Research, publications, supervisor, research fit |
| Section order | Summary → Skills → Experience → Projects → Education | Education → Research → Publications → Experience → Skills |
| Publications | Compressed or a single line | **Front and center**, full citations, author position |
| Bullets | Tight, metric-driven, product/impact framing | Methods + contribution + research significance |
| Keywords | Mirror the job description (ATS) | Mirror the lab's research area and methods |
| Opening line | Optional one-liner tuned to the role | Research-interest statement |

Right target, right emphasis: no publications-heavy document in an industry slot, no buried
research in an academic one.

### ATS rules (industry only; academia does not use ATS)
- Single-column logical reading order and standard headings (Experience, Education, Skills, Projects).
- No text inside images; nothing critical in page headers or footers.
- Real, selectable text (LaTeX PDF output qualifies).
- Mirror the exact keywords and phrasing of the job description for skills, tools, frameworks.
- Avoid layout tables that break linear reading order. Two-column dated entries are fine when each
  entry is a self-contained line; check this when tailoring.

### Tailoring to a job or program
1. **Intake** the description: required skills, tools, themes, keywords.
2. **Map** each requirement to evidence in the master profile. Flag gaps; don't fabricate.
3. **Select and order** the most relevant experiences and projects for this target.
4. **Rephrase** as CAR bullets using the job's exact keywords (industry) or the lab's research
   vocabulary (academic).
5. **ATS pass** (industry only): keyword coverage and a clean linear structure.
6. **Compile and review** the PDF (loop below).

Keep one master `.tex` per target. Create a tailored copy per application only if the user wants
per-application variants, and name it after the target. To spin a new variant, copy the nearest
existing `.tex` and tailor it.

## Authoring conventions (LaTeX)
- Use the class's environments and macros. **Do not redefine formatting inside a resume `.tex`.**
  With a RenderCV-style class that typically means:
  - `\begin{header}...\end{header}` for the name/contact block;
  - `\section{...}` for (auto-ruled) section titles;
  - `\begin{twocolentry}{<right-aligned date>} <left content> \end{twocolentry}` for dated entries;
  - `\begin{threecolentry}{<middle>}{<right>}...\end{threecolentry}` when a third column is needed;
  - `\begin{onecolentry}...\end{onecolentry}` to wrap nested `highlights`;
  - `\begin{highlights}\item ...\end{highlights}` for bullets.
- If the class defines footer or metadata macros (name, email), fill them from the master profile.
- If the repo has a smoke-test `.tex` covering every macro, copy patterns from it.
- Keep contact details as plain text. `fontawesome5` is known to crash Tectonic on Windows; do not
  add it to a class or document compiled with Tectonic.
- Tectonic only searches the input file's own directory for a custom class, so keep each `.tex`
  next to the `.cls` (or put the class where the engine will find it).

## Compile and verify loop
From the repo root, using the user's engine (Tectonic shown):
```
tectonic -X compile <path/to/file>.tex --outdir build
```
Then **read the produced PDF and verify it visually** before claiming done:
- Industry: it fits on **one page**.
- Academic: publications render with the correct author position and full citations.
- Both: section order, right-aligned dates, no overflow, correct header/footer.

Keep the PDF output directory git-ignored; PDFs are disposable build artifacts.

## MUST-DO: fill the page(s) cleanly
Every resume must **fill its page(s) with even spacing**: no large blank gap at the bottom and no
near-empty last page. Once the content is right, **tune line spacing and margins per file** until
it fills well:
- Knobs (a small block in the `.tex` preamble before `\begin{document}`):
  `\linespread{…}` · `\titlespacing*{\section}{0pt}{before}{after}` ·
  `\renewenvironment{highlights}{\begin{itemize}[topsep=…,parsep=…,itemsep=…,leftmargin=12pt]}{\end{itemize}}` ·
  `\geometry{top=…,bottom=…,left=…,right=…}`.
- Targets: a 1-pager fills ~90–100% of the page (not 75%). A 2-pager has **page 1 full (no
  mid-document gap)** and a last page as full as the content honestly allows (≥ ~70% when
  possible). If a page is left very empty, compress to fewer pages or redistribute.
- Typical starting points: 1-page → `\linespread{1.0–1.06}`; 2-page English → `\linespread{1.1}`
  with `\section` spacing before ~`0.42cm`; 2-page CJK → `\linespread{1.1–1.18}`.
- Iterate compile → read → adjust. **This is a required finishing step for every new resume.**

## Hard guardrails
- **No fabrication.** Experiences, employers, dates, titles, and metrics come only from the master
  profile. Sharpen phrasing; never invent substance.
- **Right target, right emphasis.** Follow the industry-vs-academic table above.
- **Facts change in one place.** When real facts change, update the master profile, not the
  `.tex`, then regenerate the affected variants.
- **Verify before done.** Always compile and read the PDF; report page fit and citation accuracy
  with evidence, not assertions.
- **No AI tells in the prose.** No em-dashes (`---`/`—`/`——`) as connectors; use a period, comma,
  colon, or parentheses. Keep en-dash ranges (`2023 -- 2026`, `3--4$\times$`). Put spoken languages
  in the Skills section (for example "Spoken languages" / "语言能力"), not appended to a degree
  line. Keep bold, bullets, and CAPS headings; never prose-ify, thin the bold, weaken a CAR bullet,
  or drop a metric just to sound "human".
