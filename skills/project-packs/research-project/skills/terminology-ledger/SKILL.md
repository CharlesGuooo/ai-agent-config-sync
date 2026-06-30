---
name: terminology-ledger
description: >-
  Keep terminology, acronyms, and notation consistent across a manuscript. Use
  when writing or polishing a paper/thesis and the user wants to catch
  inconsistent terms ("3DGS" vs "3D-GS" vs "3D Gaussian Splatting"), acronyms
  used before they're defined or defined two different ways, variant spellings
  ("fine-tune"/"finetune"), or symbol collisions in math-heavy sections.
  Triggers: "check my terminology", "are my terms consistent", "terminology
  ledger", "did I define all acronyms", "notation consistency". Especially useful
  for math/systems papers (3DGS, NPU operators, world models) where a single
  symbol or term used two ways confuses reviewers.
metadata:
  category: research
  tags: [terminology, notation, acronyms, consistency, writing]
---

# Terminology Ledger

Build and enforce a single source of truth for how every term, acronym, and symbol
is written in the manuscript. Inconsistent terminology reads as careless and makes
reviewers doubt the rigor — and it is cheap to fix once surfaced.

## Workflow

### 1. Scan for candidates and inconsistencies
```
python scripts/scan.py <paper.tex | paper.md | dir>
```
Heuristically reports:
- **Acronyms** and their definition(s); flags any acronym **defined more than one way**,
  **used before first definition**, or **used but never defined**.
- **Surface variants** of the same term (normalized by case/hyphen/space), e.g.
  `fine-tune` / `finetune` / `fine tune`, `dataset` / `data set`, `3DGS` / `3D-GS`.
- A frequency count so you can pick the dominant form as canonical.

The script is heuristic and stdlib-only — it surfaces candidates; you decide.

### 2. Build the ledger
Create/maintain a `TERMINOLOGY.md` next to the paper with the agreed canonical forms:
```
| Concept | Canonical | Acronym | Defined at | Do NOT write |
| --- | --- | --- | --- | --- |
| 3D Gaussian Splatting | 3D Gaussian Splatting | 3DGS | sec 1, first use | 3D-GS, 3DGs, GS |
| operator fusion | operator fusion | — | sec 3.1 | op-fusion, kernel fusion (different) |
```
Rules: define each acronym **once**, at first use, as "Full Name (ACR)"; use the
acronym consistently thereafter; pick one spelling/hyphenation per concept; reserve each
math symbol for one meaning.

### 3. Enforce
For each non-canonical variant the scan found, fix occurrences to the canonical form
(use `Grep` to find them, edit in place). Re-run the scan until only intentional
distinctions remain (e.g. `kernel fusion` and `operator fusion` if you genuinely mean
two different things — then make that distinction explicit in the text).

## Notes
- Distinguish *true synonyms to unify* from *near-terms to keep distinct* — don't collapse
  a meaningful distinction just because the strings look similar.
- For notation: keep a symbol table; the scan flags repeated `\newcommand`/`\def` and
  obvious reuse, but a human should verify each symbol has one meaning.
- Run late (after content is stable) and again right before submission.
