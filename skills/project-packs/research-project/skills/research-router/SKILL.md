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
| Retrieving specific papers, or mining ones you already have | `literature/` | `paper-lookup` (11 scholarly APIs, free), `paper-library` (your own PDFs), `survey-outline` (comparison table) |
| Turning a reference into BibTeX, or checking a `.bib` | `literature/` | `bibtex-manager` |
| Starting a direction, or deciding what to do | `gates/` | `field-map` (what the field contests) → `idea-forge` (candidates) → `idea-triage` (kill the rest) → `falsification-design` (the number that ends the claim) → `experimental-design` |
| Writing or restructuring the manuscript | `manuscript/` | `paper-writing` (what the prose says), `latex-paper-en` (inside the `.tex`), `academic-humanizer` (de-AI a draft), `terminology-ledger` (notation consistency) |
| Making the figures | `manuscript/` | `paper-figures` |
| Formatting for a venue, or packaging the artifact | `manuscript/` | `venue-templates`, `repro-pack` |
| Attacking a draft, or answering reviewers | `review/` | `paper-stress-test` (yours), `peer-review` (theirs), `auto-review-loop` (yours, iterated with a second model), `rebuttal` (answering the reviews you got) |
| Standing in front of people | `talks/` | `scientific-slides`, `latex-posters`, `pptx-posters` |

## By where the paper is in its cycle

The strongest routing signal for conference work is not the task, it is the phase. Two or three
papers in flight are usually in different ones.

| Phase | `cd` | First moves |
|---|---|---|
| A direction, no candidates yet | `gates/` | `field-map` → `idea-forge` → `idea-triage`. Field maps live in the field directory and are reused by the next paper in the same area |
| Direction chosen, nothing run | `gates/` then `literature/` | `falsification-design` → `experimental-design` → `ablation-planning`, then `paper-lookup` to check nobody has published it |
| Results in hand, nothing written | `gates/` then `manuscript/` | `claim-calibration` first — it sets what the numbers license you to say — then `paper-writing`, `paper-figures`, `latex-paper-en` |
| Draft exists, ~2 weeks out | `manuscript/` | `paper-figures` → `terminology-ledger` → `academic-humanizer` |
| Days out | `review/` | `paper-stress-test` → fix → `auto-review-loop` |
| Submitting | `manuscript/` | `venue-templates`, then compile |
| Reviews received | `review/` | `rebuttal` |
| Accepted | `talks/` + `manuscript/` | `scientific-slides` / `latex-posters`, and `repro-pack` |

## The gates, and why they are a sub-pack

Six of the eight skills in `gates/` exist nowhere else — not in this pack before now, and not in any
of the published research-agent systems surveyed. Each runs **before** the thing it authorises,
emits an artifact a human approves or rejects, and refuses to close on an unrecorded decision.

| Skill | Authorises | The move nothing else makes |
|---|---|---|
| `field-map` | reading a field at all | records what you believed **before** searching, then hunts contradictions and unexamined assumptions rather than summarising. Never scores novelty — LLM-judged novelty correlates *negatively* with real impact |
| `idea-forge` | proposing candidates | refuses a candidate it cannot trace to a named anomaly, and refuses a pool where everything is "combine A and B" — the shape a model produces when it has nothing |
| `idea-triage` | committing to a direction | judges each idea by the paper it produces if the experiment merely *works as expected*, not by how it reads at proposal |
| `falsification-design` | launching the run | a numeric kill threshold you confirm you would honour, plus a **closed list of which excuses will be admissible** when it fails |
| `ablation-planning` | the results table | walks twelve *kinds* of ablation, not the boxes in your architecture figure, and diffs against three competitors' tables |
| `claim-calibration` | what the paper asserts | grades outcome, mechanism and honesty **separately**, and resolves every headline number to a file on disk |

They chain: kills seed claims, claims get thresholds, thresholds request ablations, ablations
license claims. Each also works alone — the artifacts are the state, and the state store is only an
index of them.

## Cost and credentials

**The whole paper pipeline — literature, gates, manuscript, review — runs without a paid API
key.** Exactly one skill is billed, it lives in `talks/`, and it says so. Every skill declares a
`compatibility:` line whose first word is its tier:

| Tier | Meaning |
|---|---|
| `offline` | No network, no credentials. Most of the pack. |
| `network` | Public APIs, no credentials required. `paper-lookup` (11 scholarly APIs), `bibtex-manager` (CrossRef, NCBI), the `survey-*` chain (WebSearch). |
| `local-tools` | Needs a binary. `latex-paper-en` and `venue-templates` need a LaTeX engine — Tectonic is self-contained and is what this machine has. `pptx-posters` needs libreoffice. `auto-review-loop` needs a second agent CLI to be the reviewer. |
| `paid` | Requires a billed key. **`talks/scientific-slides` only**, for its AI slide-image path — and only that path. Its structure, timing, Beamer and PPTX paths are free. It carries a `## Cost` section; read it before running the billed path, because `OPENROUTER_API_KEY` is set here, so it will not error, it will charge. |

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
