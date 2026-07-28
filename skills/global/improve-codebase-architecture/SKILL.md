---
name: improve-codebase-architecture
description: >-
  Scan an existing codebase for deepening opportunities (shallow modules worth
  restructuring), present them as a visual HTML report with before/after
  diagrams, then work through whichever candidate the user picks. Use when the
  user asks for an architecture review, "where is this codebase hurting", "what
  should I refactor", a tech-debt survey, or a periodic codebase health check.
  Distinct from codebase-design (which designs ONE module) — this surveys the
  whole codebase and ranks candidates. Read-heavy and slow; not for a quick
  answer.
allowed-tools: Read, Grep, Glob, Bash, Write, Agent
metadata:
  category: design
  tags: [architecture, refactor, tech-debt, review, html-report, deep-modules]
  source: >-
    Vendored from `mattpocock/skills` (MIT) —
    `engineering/improve-codebase-architecture`, HTML-REPORT moved under
    `references/`. Adapted: upstream calls a standalone `/grilling` skill, which
    in this harness lives inside `brainstorming`; subagent dispatch is phrased
    harness-agnostically. Adapted, not copied.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors
that turn shallow modules into deep ones. The aim is testability and AI-navigability.

This skill is *informed* by the project's domain model and built on a shared design
vocabulary:

- Use the **`codebase-design`** skill for the architecture vocabulary (**module**,
  **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its
  principles (the deletion test; "the interface is the test surface"; "one adapter =
  hypothetical seam, two = real"). Use those terms exactly — don't drift into
  "component," "service," "API," or "boundary."
- The domain language in `CONTEXT.md` gives names to good seams; ADRs in `docs/adr/`
  record decisions this skill should not re-litigate.

## Process

### 1. Explore

**Scope before you scan — YAGNI.** Deepening a module pays off by making *future*
changes easier, so weight the parts of the codebase that have recently changed:

- If the user named a direction — a module, a subsystem, a pain point — take it and
  skip the inference below.
- Otherwise walk back a good stretch of `git log --oneline` to find hot spots — the
  files that keep coming up — and let those pull your attention first. If changes are
  scattered with no clear hot spot, widen the net.

Read the domain glossary (`CONTEXT.md`) and any ADRs covering the area first.

Then dispatch a **read-only exploration subagent** to walk the codebase (in Claude
Code: the Agent tool with `subagent_type=Explore`; in other harnesses, the equivalent
read-only search agent). Don't follow rigid heuristics — explore organically and note
where you hit friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, while the real bugs
  hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it
concentrate complexity, or just move it? "Concentrates" is the signal you want.

### 2. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory so nothing lands in the
repo — `<tmpdir>/architecture-review-<timestamp>.html` (`%TEMP%` on Windows,
`${TMPDIR:-/tmp}` elsewhere), a fresh file per run. Open it (`start` / `open` /
`xdg-open`) and tell the user the absolute path.

Tailwind + Mermaid via CDN. Use Mermaid where relationships are graph-shaped (call
graphs, dependencies, sequences) and hand-built divs/SVG where you want something more
editorial. Every candidate gets a **before/after visualisation**. Be visual.

Each candidate card carries:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture causes friction
- **Solution** — plain-English description of what would change
- **Benefits** — in terms of locality and leverage, and how tests would improve
- **Before / After diagram** — side by side, illustrating shallowness and deepening
- **Recommendation strength** — `Strong` / `Worth exploring` / `Speculative`, as a badge

End with a **Top recommendation**: which candidate to tackle first, and why.

Use `CONTEXT.md` vocabulary for the domain and `codebase-design` vocabulary for the
architecture. If `CONTEXT.md` defines "Order," say "the Order intake module" — not
"the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, surface it only when the
friction is real enough to warrant reopening that ADR, and mark it clearly in the card
(*"contradicts ADR-0007 — but worth reopening because…"*). Don't list every theoretical
refactor an ADR forbids.

Full scaffold, diagram patterns, and styling: `references/HTML-REPORT.md`.

**Do NOT propose interfaces yet.** After the file is written, ask: "Which of these
would you like to explore?"

### 3. Work the chosen candidate

Once the user picks one, run the **`brainstorming`** skill — its interrogation engine
walks the decision tree with them one question at a time: constraints, dependencies,
the shape of the deepened module, what sits behind the seam, which tests survive.

Side effects happen inline as decisions crystallise — use the **`domain-modeling`**
skill to keep the model current:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term (create
  the file lazily if absent).
- **Sharpening a fuzzy term mid-conversation?** Update `CONTEXT.md` right there.
- **User rejects a candidate for a load-bearing reason?** Offer an ADR — *"Want me to
  record this so future architecture reviews don't re-suggest it?"* Only when a future
  explorer would actually need it; skip ephemeral ("not worth it right now") and
  self-evident reasons.
- **Want alternative interfaces for the deepened module?** Use `codebase-design`'s
  design-it-twice parallel-subagent pattern.
