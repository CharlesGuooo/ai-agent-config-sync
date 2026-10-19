---
name: venue-templates
description: >-
  Gets the right template and the formatting rules for a specific venue, and checks a manuscript
  against them. Ships real author-kit style files for NeurIPS 2025, ICLR 2026, ICML 2026, ACL,
  AAAI-26 and COLM 2025, plus formatting requirements for Nature, Science, PLOS, IEEE and ACM.
  Use for "投 ICLR 要用什么模板", "换投到 CVPR", "页数限制是多少", "格式对不对",
  "NeurIPS template", "reformat for ACL", "what is the page limit", "which style file".
  Distinct from latex-paper-en, which checks and repairs an existing .tex against a spec — this
  one hands you the spec and the starting files. Posters are latex-posters' job, and grant
  proposals are not covered in this pack.
allowed-tools: Read, Write, Edit, Bash
license: MIT license
compatibility: "local-tools — a LaTeX engine to build the templates and Poppler to inspect PDFs; helper scripts are Python 3.11+ stdlib and make no network requests; no credentials. Checking current venue rules means opening the official pages on the web."
metadata:
  version: "1.6"
  last-reviewed: "2026-10-01"
  skill-author: K-Dense Inc.
  source: >-
    Body from K-Dense Inc. (MIT). assets/venues/ added here from
    Orchestra-Research/AI-Research-SKILLs — see assets/venues/PROVENANCE.md, which records that
    the conference .sty/.bst files carry their venues' own terms rather than either repository's
    licence. Removed here: assets/grants/ and references/grants_requirements.md, since
    research-grants is no longer in this pack; assets/posters/ and references/posters_guidelines.md
    moved to latex-posters in talks/.
---

# Venue Templates

Prepare publication documents without treating stale formatting details as authoritative. This skill combines:

- a verification-first workflow for current venue rules;
- bundled LaTeX scaffolds for a small, explicit set of document types;
- writing-style and reviewer-expectation guides; and
- local helpers for discovering, copying, and inspecting templates.

## Mandatory Currency Rule

Venue requirements are time-sensitive. Before giving exact page limits, deadlines, style-file names, anonymity rules, or required sections:

1. Identify the exact venue, year or funding cycle, track, and article or proposal type.
2. Open the official author instructions, call, solicitation, notice of funding opportunity (NOFO), or policy guide.
3. Record the source URL and the date checked.
4. Distinguish initial submission, revision/rebuttal, and camera-ready rules.
5. Treat bundled files as scaffolds unless this skill explicitly says they are a copy of an official template.

Never infer a current style-file name by changing the year in an old filename. Never present a generic scaffold as an official venue template.

## When to Use

Use this skill for:

- locating official journal or conference author instructions;
- checking page limits, required sections, anonymity, supplemental-material rules, or citation style;
- choosing and adapting a bundled LaTeX scaffold;
- adapting prose to a venue's audience and reviewer expectations; or
- inspecting a PDF's page count and embedded fonts.

Not for posters — `latex-posters` in `~/research-project/talks/` owns poster templates and
sizing — and not for grant proposals, which this pack does not cover.

## Verification-First Workflow

### 1. Resolve the exact target

Ask for or derive:

- venue or funding agency;
- year/cycle and track;
- document type, such as research article, short paper, main track, R01, or R21;
- submission stage; and
- authoring format, such as LaTeX or Word.

Do not combine rules from similarly named venues or tracks.

### 2. Consult the right reference

| Need | Reference |
|---|---|
| Journal submission and official publisher resources | `references/journals_formatting.md` |
| Conference rules and 2026 verified snapshots | `references/conferences_formatting.md` |
| Cross-venue writing comparison | `references/venue_writing_styles.md` |
| Nature and Science writing | `references/nature_science_style.md` |
| Cell Press writing | `references/cell_press_style.md` |
| Medical journal writing | `references/medical_journal_styles.md` |
| ML and computer-vision conference writing | `references/ml_conference_style.md` |
| ACL, EMNLP, CHI, and other CS writing | `references/cs_conference_style.md` |
| Review criteria and rebuttals | `references/reviewer_expectations.md` |

Reference files summarize rules but do not override the current official source.

### 3. Capture a compliance note

Before editing, write a short note in the working document or task log:

```text
Target: ICML 2026 main track, initial submission
Official source: https://icml.cc/Conferences/2026/AuthorInstructions
Checked: 2026-10-01
Main-text limit: 8 pages
References/appendices: additional pages allowed in the same PDF
Anonymity: required
Official template: ICML 2026 style package linked by the author instructions
```

This makes later validation reproducible.

### 4. Start from the official template

For annual conferences and publisher-managed workflows:

1. Download the template from the official source.
2. Keep its class/style files unchanged.
3. Add content without overriding margins, font sizes, spacing, or headers.
4. Use a bundled scaffold only for drafting or when the official source explicitly permits it.

For grants, many components are entered or uploaded separately. Do not submit a combined bundled `.tex` file as if it were an agency-issued form.

### 5. Validate manually and mechanically

Verify at least:

- main-text and total-file page rules;
- font, margin, line-spacing, and paper-size rules;
- anonymity and metadata;
- required sections, statements, checklists, and disclosures;
- figure/table placement and accessibility;
- reference and supplemental-material treatment; and
- source-package and PDF requirements.

The helper counts PDF pages and reads Poppler font-embedding flags. It reports
nonembedded fonts as failures, but cannot prove margin, font-size, excluded-section,
or anonymity compliance. A zero exit status means no automated failure was found;
manual and skipped inspections still require attention.

## Bundled Assets

The repository intentionally bundles only the following templates. Other venues listed in references require an official external template.

### Journal and conference scaffolds

| File | Status |
|---|---|
| `assets/journals/nature_article.tex` | Generic Nature-oriented writing scaffold; not an official Nature template |
| `assets/journals/plos_one.tex` | PLOS ONE-oriented scaffold; compare with the current official PLOS LaTeX package |
| `assets/journals/neurips_article.tex` | NeurIPS 2026 wrapper; requires the official `neurips_2026.sty` |
| `assets/journals/elsarticle-template-num.tex` | Elsevier `elsarticle` numeric example |
| `assets/journals/elsarticle-template-num-names.tex` | Elsevier `elsarticle` numbered/name example |
| `assets/journals/elsarticle-template-harv.tex` | Elsevier `elsarticle` author-year example |

The matching Elsevier `.bst` files are in `assets/journals/`.

### ML conference author kits

Copies of the official author kits for NeurIPS 2025, ICLR 2026, ICML 2026, ACL (rolling),
AAAI-26 and COLM 2025, one directory each under `assets/venues/`. Read
`assets/venues/PROVENANCE.md` first: the style files carry each venue's own terms, and a kit
changes between years and sometimes between the CFP and the camera-ready. They are official
templates for those years only — re-download the current kit from the venue before submitting.

## Common Workflows

### Annual conference paper

1. Open `references/conferences_formatting.md`.
2. Follow the official link for the exact year and track.
3. Download the official author kit.
4. Draft in the official template.
5. Keep identifying information out of every submitted file when review is blind. Inspect supplementary archives and linked code/data in addition to the PDF: author names, notebook outputs, local paths, repository ownership, and revision history can disclose identity. Follow the venue's exact link and freeze rules; for example, ICML 2026 requires an anonymous code-repository branch that is not modified after the submission deadline.
6. Check the paper checklist, supplement, rebuttal, and camera-ready rules separately.

For NeurIPS 2026, the bundled wrapper can be copied after downloading the official style file:

```bash
python scripts/customize_template.py \
  --template neurips_article.tex \
  --output my_neurips_2026_paper.tex
```

For a venue under `assets/venues/`, start from that directory only after confirming on the
official page that no newer kit has been published.

### Journal manuscript

1. Resolve the exact journal and article type.
2. Determine whether initial submission is format-flexible.
3. Use the journal's official template or submission format when required.
4. Apply the appropriate writing-style reference.
5. Recheck final-production instructions only after acceptance or revision.

Do not apply a publisher-wide template when the journal provides its own Guide for Authors.

## Helper Scripts

Run scripts from the skill directory. Python helpers use only the standard library.
Network access is needed to obtain current official instructions and author kits; the
helpers themselves make no network requests. See `references/current_sources.md`
for the 2026-10-01 source audit and executed compilation coverage.

### List bundled templates

```bash
python scripts/query_template.py --list-all
python scripts/query_template.py --venue NeurIPS --requirements
```

The query helper reports only assets that exist in this skill and includes source/currency notes.

### Copy and customize a scaffold

```bash
python scripts/customize_template.py \
  --template nature_article.tex \
  --title "Your Paper Title" \
  --authors "First Author, Second Author" \
  --affiliations "Institution Name" \
  --output my_paper.tex
```

Values are literal LaTeX source: escape text such as `&` as `\&` yourself.
The helper replaces recognized placeholders only; it does not restructure PLOS
per-author affiliation mappings or fill the empty fields in official Elsevier samples.
Review every replacement and compile before adding substantial content.

### Inspect a PDF

Use a dated initial-submission preset. Later-stage allowances require an explicit limit
and source:

```bash
python scripts/validate_format.py \
  --file paper.pdf \
  --venue icml-2026 \
  --content-pages 8 \
  --check page-count,fonts
```

Or provide an explicit limit and source (the NSF narrative below only illustrates the flags;
grant proposals are otherwise not covered in this pack):

```bash
python scripts/validate_format.py \
  --file proposal.pdf \
  --max-pages 15 \
  --content-pages 15 \
  --source-url "https://www.nsf.gov/policies/pappg" \
  --check page-count,fonts \
  --report validation.txt
```

`--content-pages` must be counted according to the official rule. The script does not infer where references or appendices begin. Do not combine `--venue` and `--max-pages`; use an explicit limit for a different year, track, stage, or solicitation.

## Final Compliance Checklist

- [ ] Exact venue, year/cycle, track, article type, and stage identified
- [ ] Official source URL recorded with date checked
- [ ] Official template or form used where required
- [ ] Page-limit scope understood, including excluded sections
- [ ] Required statements, checklists, and disclosures present
- [ ] Blind-review files and PDF metadata checked for identity leaks
- [ ] Figures and tables are legible and accessible
- [ ] References, appendices, and supplements follow current rules
- [ ] PDF and source package compile cleanly
- [ ] Submission portal preview reviewed before final submission

## Maintenance

This skill was reviewed on 2026-10-01. Annual conference snapshots are labeled with their year and are not automatically the next open submission cycle. The source ledger records inaccessible current rules instead of retaining unverified numerical limits. When updating:

1. replace year-specific claims only after checking official sources;
2. avoid adding links to assets that are not bundled;
3. keep generic guidance separate from official requirements;
4. update helper presets and examples together; and
5. increment `metadata.version`.
