---
name: research-router
description: >-
  Routes a research task to one of five sub-packs under ~/research-project/ — literature, gates,
  manuscript, review, talks. Use FIRST when a session starts at the research-project root, when
  the user names a research task without saying which directory, or when they ask which one to
  cd into. Triggers: "写论文", "找文献", "做实验设计", "跑消融", "投稿", "rebuttal", "poster",
  "调研一下", "start a new paper", "I need to review this", "which one do I cd into". This
  container holds exactly one skill — this one. Every capability lives one level down, and is
  only loaded once you are inside its sub-pack, which is the point.
allowed-tools: Read, Glob
compatibility: "offline — a routing table; no scripts, no network, no credentials"
metadata:
  category: research
  tags: [routing, container, sub-packs]
---

# Research router

`~/research-project/` is a container, not a skill pack. Nothing here does the work. Pick a
sub-pack, `cd` into it, and that pack's skills load — the others stay out of context.

## By what you are doing

| You are… | Go | Reach for |
|---|---|---|
| Looking for prior work, or mining papers you already have | `literature/` | `paper-library` (your own PDFs), `literature-review` (systematic protocol), `survey-outline` (comparison table) |
| Turning a reference into BibTeX, or checking a `.bib` | `literature/` | `bibtex-manager` |
| Deciding what to do, or how you would know it failed | `gates/` | `hypothesis-generation` |
| Writing or restructuring the manuscript | `manuscript/` | `latex-paper-en` (inside the `.tex`), `academic-humanizer` (de-AI a draft), `terminology-ledger` (notation consistency) |
| Making the figures | `manuscript/` | `paper-figures` |
| Formatting for a venue, or packaging the artifact | `manuscript/` | `venue-templates`, `repro-pack` |
| Attacking a draft — yours or someone else's | `review/` | `paper-stress-test` (yours), `peer-review` (theirs), `auto-review-loop` (yours, iterated with a second model) |
| Standing in front of people | `talks/` | `scientific-slides`, `latex-posters`, `pptx-posters` |

## By where the paper is in its cycle

The strongest routing signal for conference work is not the task, it is the phase. Two or three
papers in flight are usually in different ones.

| Phase | `cd` | First moves |
|---|---|---|
| No committed direction | `gates/` | `hypothesis-generation` |
| Direction chosen, nothing run | `gates/` then `literature/` | scope the claim, then check nobody has published it |
| Results in hand, nothing written | `manuscript/` | `latex-paper-en`, `paper-figures` |
| Draft exists, ~2 weeks out | `manuscript/` | `paper-figures` → `terminology-ledger` → `academic-humanizer` |
| Days out | `review/` | `paper-stress-test` → fix → `auto-review-loop` |
| Submitting | `manuscript/` | `venue-templates`, then compile |
| Reviews received | `review/` | `peer-review` for the norms, then write the response |
| Accepted | `talks/` + `manuscript/` | `scientific-slides` / `latex-posters`, and `repro-pack` |

## Cost and credentials

After the restructure, **nothing in this pack requires a paid API key.** Every skill declares a
`compatibility:` line whose first word is its tier:

| Tier | Meaning |
|---|---|
| `offline` | No network, no credentials. Most of the pack. |
| `network` | Public APIs, no credentials required. `bibtex-manager` (CrossRef, NCBI), the `survey-*` chain (WebSearch). |
| `local-tools` | Needs a binary. `latex-paper-en` needs a LaTeX engine — Tectonic is self-contained and is what this machine has. |
| `paid` | Requires a billed key. **Nothing in this pack is on this tier.** |

One rule keeps it that way: *a skill may not tell the agent to invoke a `paid` skill unless it
declares `paid` itself, names the key, and carries a `## Cost` section.* Twelve skills used to
inherit a billed image-generation dependency through a boilerplate block that none of them
disclosed, on a machine where the key is set — so the failure mode was a silent charge, not an
error.

## Where things went

Kept for one release, because these names are in muscle memory and in old prompts.

| Old | Now |
|---|---|
| `citation-management` | `literature/bibtex-manager` — and it no longer claims to search |
| `latex-compilation` | `manuscript/latex-paper-en` (Tectonic is a first-class engine there) |
| `scientific-figure-making`, `scientific-visualization` | `manuscript/paper-figures` |
| `scientific-critical-thinking` | `review/peer-review` |
| `research-zh/research*` | `literature/survey-outline`, `survey-deep`, `survey-report` |
| `research-en`, `research-codex-en`, `research-codex-zh` | deleted — three copies of the same pipeline, none of them discoverable |

Deleted with no successor: `paper-2-web`, `pyzotero`, `scholar-evaluation`, `scientific-brainstorming`
(use the global `brainstorming`), `scientific-schematics` (draw diagrams deliberately — `drawio-skill`
in `~/dev-project/`), `research-grants`.

Everything is recoverable from git history; the deletions name their pre-delete SHA in the commit.
