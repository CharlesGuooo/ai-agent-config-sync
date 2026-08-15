---
name: book-to-skill
description: >-
  Mine a technical book (PDF/EPUB/DOCX/TXT/MD/HTML/RTF/MOBI…) into a reusable
  SKILL.md — its frameworks, mental models, principles and anti-patterns. Use
  for "turn this book into a skill", "把这本书变成 skill". Pointer skill: install
  first (see Setup). Where skill-creator authors from scratch, this mines an
  existing book.
allowed-tools: Read, Write, Edit, Bash
metadata:
  category: routing
  tags: [skills, books, extraction, pointer, meta]
  source: >-
    Pointer to `virgiliojr94/book-to-skill` (MIT) — a ~20-file Python package
    (format parsers + CLI), deliberately NOT vendored. Moved from
    productivity-project to the global layer in 2026-08: it is skill-authoring
    meta-tooling like skill-creator, not a productivity-domain skill.
---

# book-to-skill (pointer)

Turns long-form books into compact, callable expertise. Where **`skill-creator`**
authors a skill from scratch, **`book-to-skill`** mines one out of a book you've
already read.

**Source:** https://github.com/virgiliojr94/book-to-skill (MIT)
**Why a pointer, not vendored:** it's a ~20-file Python package (format parsers +
CLI). Cleaner to install on demand than to mirror into the sync repo.

## ⚠️ Do NOT install it the way upstream's README says

Upstream's primary instruction is:

```bash
# DO NOT DO THIS on a machine synced by this repo
git clone https://github.com/virgiliojr94/book-to-skill.git ~/.claude/skills/book-to-skill
```

`~/.claude/skills/` (and the Cursor/Codex/OpenCode equivalents) is **mirrored** from
this repo with `robocopy /MIR` / `rsync --delete`. Anything living there that isn't in
`skills/global/` is **deleted on the next sync, silently.** A skill installed that way
will vanish and you won't be told.

**Install the standalone CLI instead** — it lives outside the mirrored tree, so sync
never touches it.

## Setup (first use)

```bash
pip install "book-to-skill[pdf,epub,docx]"   # extras as needed
book-to-skill --check                        # verify parsers are present
```

Keep the dependency auto-installer in prompt mode so it can't pull packages silently:

```bash
export BOOK_SKILL_INSTALL_MISSING=ask        # this is the default; don't change it
```

## Use

```bash
book-to-skill ~/path/to/book.pdf             # emits a SKILL.md
book-to-skill ~/path/to/book.epub --mode text
```

Supported inputs: PDF · EPUB · DOCX · TXT · Markdown · reStructuredText · AsciiDoc ·
HTML · RTF · MOBI/AZW/AZW3.

## After it generates a skill — this part is on you

The output is a **draft**, not a finished skill. Before it goes anywhere:

1. **Read it.** Generated skills from niche books usually need real cleanup.
2. **Audit it against the rubric** — hand the draft to `skill-creator` ("审一下这个
   skill"). It grades against `references/rubric.md` and reports a verdict per
   failure mode. Mined skills fail hardest on triggering and on sprawl.
3. **Decide where it belongs.** Domain-specific (almost always, for a book) → the
   matching local pack, not `skills/global/`. Use `skill-router` if unsure.
4. **Register it** if it lands in `skills/global/`: add a `catalog.json` entry, then
   run `node scripts/gen-skill-table.mjs` + `gen-harness.mjs`. The drift gate fails
   otherwise.

## Security

Local document processing only — no network egress during intake. The one behaviour
to know: `dependencies.py` can `pip install` missing parsers; keeping
`BOOK_SKILL_INSTALL_MISSING=ask` (the default) makes it prompt first.
