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
**Why a pointer, not vendored:** it's a Python extractor package plus a long generator spec
(upstream's own `SKILL.md`). Cleaner to fetch on demand than to carry in this repo.

## ⚠️ Do NOT install it the way upstream's README says

```bash
# DO NOT RUN THESE on a machine set up by this repo
npx skills add virgiliojr94/book-to-skill
git clone https://github.com/virgiliojr94/book-to-skill.git ~/.claude/skills/book-to-skill
```

`~/.claude/skills/book-to-skill` is this pointer skill: a link (a junction on Windows) into the
repo, put there by `node harness.mjs`. `npx skills add` would write upstream's files through that
link into the repo, over this file; the `git clone` stops because the folder is not empty. A copy
in another skills folder clashes by name with this skill too: in `~/.agents/skills/`, which Codex
and OpenCode read (Claude Code does not), and in a project's `.claude/skills/`, where Claude Code
shows only one of the two.

## Setup (first use)

Clone it **outside every skills folder**, and check which extractors are installed:

```bash
git clone https://github.com/virgiliojr94/book-to-skill.git ~/tools/book-to-skill
python3 ~/tools/book-to-skill/scripts/extract.py --check   # `python` on most Windows machines
```

Keep the dependency auto-installer in prompt mode so it can't pull packages silently:

```bash
export BOOK_SKILL_INSTALL_MISSING=ask        # this is the default; don't change it
```

## Use

Read `~/tools/book-to-skill/SKILL.md` and follow it, with the book's path (a file, folder or glob)
and an optional skill name — what upstream calls `/book-to-skill <path>... [skill-name]`. Its
Step 2 searches skills folders for `scripts/extract.py`; use the clone's instead:

```bash
python3 ~/tools/book-to-skill/scripts/extract.py ~/path/to/book.pdf --mode technical --install-missing ask   # or --mode text
```

The extractor only turns the document into text; the mining is the rest of upstream's `SKILL.md`.
(Upstream's pip package, `pip install "book-to-skill[pdf,epub,docx] @ git+https://github.com/virgiliojr94/book-to-skill.git"` —
it is not on PyPI — installs only that extractor, as the `book-to-skill` command.)

Supported inputs: PDF · EPUB · DOCX · TXT · Markdown · reStructuredText · AsciiDoc ·
HTML · RTF · MOBI/AZW/AZW3.

## After it generates a skill — this part is on you

Upstream writes the draft to `~/.agents/skills/<slug>/` and, under Claude Code, links
`~/.claude/skills/<slug>` to it (on Windows that can land as a copy). If `~/.agents/skills/` does
not exist, it writes the draft straight into `~/.claude/skills/<slug>/` instead, because that
folder already holds skills — here, a real folder next to the harness's links. The output is a
**draft**, not a finished skill. Before it goes anywhere:

1. **Read it.** Generated skills from niche books usually need real cleanup.
2. **Audit it against the rubric** — hand the draft to `skill-creator` ("审一下这个
   skill"). It grades against `references/rubric.md` and reports a verdict per
   failure mode. Mined skills fail hardest on triggering and on sprawl.
3. **Move it into the repo.** Domain-specific (almost always, for a book) → the matching
   local pack, not `skills/global/`; see the pack index in HARNESS.md if unsure. Then delete what upstream
   left: `~/.claude/skills/<slug>` (its link, copy or the draft itself) and, if it exists,
   `~/.agents/skills/<slug>`.
4. **Register it.** In `skills/global/`, add a `catalog.json` entry first. Then run
   `node scripts/gen-harness.mjs`, then `node harness.mjs check`, and finally
   `node harness.mjs update` (details: `skill-creator`'s `references/registering.md`).

## Security

Local document processing only — no network egress during intake. Two behaviours to know:
`book_to_skill/dependencies.py` can `pip install` missing parsers, and keeping
`BOOK_SKILL_INSTALL_MISSING=ask` (the default) makes it prompt first; and upstream's last step
offers to publish the generated skill to GitHub (`gh repo create`, private by default). Decline
it: the skill goes into this repo, and one made from a copyrighted book must stay private.
