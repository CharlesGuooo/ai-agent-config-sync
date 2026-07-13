---
name: narrative-flow
description: >-
  Revise an already-drafted paper for STRUCTURE and FLOW — reverse-outline
  diagnostics, one-message-per-paragraph rewriting, and section-specific
  structural craft. Use when a draft exists but reads poorly: "does my paper
  flow", "reverse outline this section", "restructure my Introduction", "this
  paragraph is unclear", "the logic jumps", "fix the narrative", "why does this
  read as incremental". Distinct from scientific-writing (drafting prose from a
  blank page), paper-stress-test (adversarial claim/rejection audit), and
  latex-paper-en (de-AI tone, tense, venue LaTeX).
metadata:
  category: research
  tags: [writing, revision, reverse-outline, narrative, structure, ml-cv-nlp]
  source: >-
    Distilled from Prof. Peng Sida (彭思达) `pengsida/learning_research`, via
    `Master-cai/Research-Paper-Writing-Skills` (MIT). Adapted, not copied.
---

# Narrative Flow (revise for structure & flow)

Goal: make an existing draft **read the way the work actually is** — one clear
story, each paragraph earning its place, no logic jumps. This is a *revision*
skill; if there is no draft yet, use `scientific-writing` to draft first.

## Cardinal principle: coherence first, sentences last

Fix the **story** before polishing sentences. A beautifully-worded paragraph in
the wrong place is worse than a rough one in the right place. Order of work:

1. Clarify the paper's one-line story (task → gap/challenge → contribution → why it works).
2. Reverse-outline each section and repair structure (below).
3. Rewrite paragraph-by-paragraph, one message each.
4. Only then do sentence-level polish (hand that to `latex-paper-en`).

## The reverse-outline diagnostic (the core move)

Run this whenever the user asks whether a section "flows" or is "clear". You are
reconstructing the outline **from the finished prose** and checking it maps.

1. Write down the **thesis / main claim** of the section.
2. Write down the **topic sentence** of every paragraph.
3. Under each, write the **evidence/explanation points** it actually contains.
4. Check upward mapping: each **topic sentence → thesis**; each **evidence point → its topic sentence**.
5. Any paragraph that will **not map cleanly** → revise it, or cut it entirely.
6. If flow is still weak, insert temporary section headers + explicit transition
   phrases while revising, then remove the scaffolding headers before finalizing.

**Diagnostic signal:** if the reverse outline is *easy* to write, the section is
well-organized. If it is *hard* — you can't state a paragraph's point, or points
won't ladder up to the thesis — the structure is broken, not the wording. Fix
structure; don't reword.

## Paragraph craft (after structure is sound)

- **One message per paragraph.** If a paragraph carries two, split it.
- **First sentence states the message.** The reader should know the paragraph's
  job from line one — no burying the point at the end.
- **Tag each paragraph's role** and keep it honest to that role:
  `opening · challenge · method · advantage · evidence · limitation`.
- **Sentence-to-sentence relation must be explicit** — every sentence connects to
  the previous by cause, contrast, consequence, refinement, or example.
- **Nouns are self-contained.** Define a term before reusing it; don't rely on
  hidden context. Keep terminology identical across the whole paper.

## Claim–evidence quick check (lightweight gate)

While revising, keep every *major* claim honest with a one-line map:

```
Claim: <what you assert> | Evidence: <result/section that backs it> | Status: supported / needs evidence
```

Treat this as a **hard constraint for the Abstract and Introduction**. If a claim
can't be supported by results, **weaken or cut it** — don't ship it. For a full
adversarial claim audit and rejection-risk pass, hand off to **`paper-stress-test`**
(don't reproduce that work here).

## The cardinal anti-pattern: naive-baseline-then-patch

Do **not** write a section by first presenting a naive/obvious solution and then
describing your improvement over it. It makes strong work read as a low-value
incremental patch by erasing the reader's curiosity. **Even if the work is
genuinely incremental, do not write it this way.** Lead with the real problem and
the insight, not with the strawman you improved on.

## Section-specific structural craft

Each section has its own distinctive structure rules (Abstract contribution
ladders, the Introduction's backward-then-forward construction, Related-Work
grouping by topic not year, the Method module triad, the Experiments three
questions + table rules, Conclusion scope-vs-defect). **Load only the section you
are editing** from `references/section-craft.md` — don't pull all of them at once.

## Output contract

When you revise a section, produce:
1. A compact **reverse outline** (thesis + one line per paragraph) showing the mapping.
2. The **revised paragraphs**, each tagged with its role.
3. A short **self-review**: clarity, flow, terminology consistency, unsupported claims.
4. The **claim–evidence map** for the section's major claims.

## Related skills (hand off, don't duplicate)

- **scientific-writing** — draft full-paragraph prose from an outline (start here if no draft).
- **paper-stress-test** — exhaustive claim audit + reviewer-rejection dimensions.
- **latex-paper-en** — sentence-level polish, de-AI tone, tense, venue LaTeX/bib.
- **peer-review** — writing a formal review of *someone else's* manuscript.
