---
name: book-to-skill
description: >-
  Convert a technical book (PDF / EPUB / DOCX / HTML / MD / RTF / MOBI) into a
  structured Claude SKILL.md — extracting the book's frameworks, mental models,
  principles, techniques, and anti-patterns into a reusable, agent-callable skill.
  Use to turn a book you've read into a "decision co-pilot". Complements the
  global `skill-creator`. POINTER skill: it's a pip package, not vendored; install
  per Setup.
---

# book-to-skill (pointer)

Turns long-form books into compact, callable expertise. Where `skill-creator`
authors skills from scratch, `book-to-skill` mines an existing book into one.

**Source:** https://github.com/virgiliojr94/book-to-skill
**Why pointer, not vendored:** it's a ~20-file Python package (format parsers +
CLI). Cleaner to `pip install` on demand than to mirror the package into the
sync repo. Low risk — local only, no network egress.

## Setup (first use)
1. `pip install book-to-skill`
2. (Optional, for EPUB/MOBI/PDF extras) the package will name any missing parser
   deps; install them yourself rather than letting it auto-install:
   `export BOOK_SKILL_INSTALL_MISSING=ask`
3. Run: `book-to-skill --help`

## Security notes
Local document processing only — no external network calls in the intake scan.
The one behavior to know: `dependencies.py` can auto-`pip install` missing
parsers; keep it in `ask` mode (the default) so it prompts first.

## Use
`book-to-skill <book-file>` to produce a SKILL.md, then review and place it in the
appropriate pack (niche books often need manual cleanup of the generated skill).
