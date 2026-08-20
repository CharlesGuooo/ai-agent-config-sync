---
name: field-map
description: >-
  Turns a research direction into a map of what the field actually disagrees about, and a register
  of anomalies an idea could come from. Takes any starting point — a field name, a paper you do not
  believe, a resource you happen to have, an unexplained result — and produces FIELD-MAP.md plus
  ANOMALIES.md, scoped to a field rather than a paper so the next paper in the same area reuses it.
  Use for "我想做 X 这个方向", "这个领域现在什么状况", "帮我把这一摞论文的矛盾点找出来",
  "map this area", "what is actually contested here", "I want to start working on X". Records the
  search that bounds every claim, so a gap is never confused with a failure to look. Distinct from
  literature-review-style synthesis, which summarises what exists; this one is looking for what
  does not hold up. Feeds idea-forge, which turns anomalies into candidates.
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch, WebFetch, AskUserQuestion
compatibility: "network — public scholarly APIs, no credentials required"
metadata:
  category: research
  tags: [literature, gap-finding, anomalies, field-map, problematization]
---

# Field map

You are not writing a review. **A review summarises what exists; this is looking for what does not
hold up.** If the output reads like a related-work section, the run failed.

State handling: [../idea-triage/references/state-contract.md](../idea-triage/references/state-contract.md).

## The two things that make this different

**1. Novelty is never scored.** Not here, not by you, not on a scale. A time-split evaluation —
generate from pre-cutoff literature only, then check against what actually got published over the
next 30 months — found LLM-judged novelty correlates **negatively** with real impact, ρ = −0.29
(p < 0.01) ([2603.15164](https://arxiv.org/abs/2603.15164)). It is not a weak signal to
down-weight. It points the wrong way. Novelty is settled by a **documented search boundary plus
the named nearest prior work**, which is step 5, not by a rating.

**2. "Nobody has done this" is never written.** The permitted phrasing is *"not located within
the documented search boundary"*, and every gap must name its nearest adjacent work or state
explicitly that none was found. An automated ideation system classified **micro-batching for SGD**
— published in 2018 — as novel, because it queried an API, got no exact string match, and defaulted
to `novel = true` ([2502.14297](https://arxiv.org/html/2502.14297v2)). Keyword absence is not
absence.

## Phase 0 — Write down what you already believe. Before searching.

**Ten minutes, and it cannot be moved later in the run.** Once you have read thirty papers you
can no longer recover what you thought unprompted, and that is the whole point: design-fixation
work shows that exposure to existing solutions constrains the solutions people then generate.

Ask the user for, and record verbatim in `FIELD-MAP.md` § Priors:

1. **What do you want to be true?** The result you would be pleased to find.
2. **5-10 things you currently believe about this direction**, including the ones you would
   defend. Beliefs about what works, what does not, what everyone gets wrong, what is overrated.
3. **What would change your mind** about any of them.

**Done when:** the Priors section exists and is timestamped, and the user has confirmed it before
any search runs. *Narrow bridge — the ordering is the mechanism.*

**This section is frozen.** After Phase 2 you may append a "What reading changed" note. You may
never edit the original. The value is the diff.

## Phase 1 — Oriented reading, 15-30 papers

### Do not sort by citations

That is the obvious move and it is wrong in a large field. Across 1.8 billion citations and 90
million papers, when a field publishes at high volume "citations flow disproportionately to
already well-cited papers; the list of most-cited papers ossifies; new papers are unlikely to ever
become highly cited"
([Chu & Evans, PNAS 2021](https://www.pnas.org/doi/10.1073/pnas.2021636118)). **Reading the
most-cited papers first is a procedure for reading the ossified part of the field.**

Use citation counts only to identify anchors, never as the ranking for what to read.

### The selection rule, in order

1. **3-5 anchors.** The papers this direction is actually about. Ask the user; they usually know.
2. **Forward citations of the anchors.** Who cites them *now*. This is what is live, as opposed
   to what was influential. `paper-lookup` (Semantic Scholar, OpenAlex) does this.
3. **The ones whose results tables disagree.** Two papers reporting on the same benchmark with
   different conclusions is the highest-yield thing in the whole procedure — go looking for it
   deliberately, not incidentally.
4. **OpenReview threads for the anchors and their neighbours.** See below.
5. Snowball both ways: backward from the anchors' reference lists, forward from step 2. **A paper
   cited by several of your included papers is likely seminal** even if its own count is modest.

### OpenReview is the highest-yield source here, and nothing else in the pack uses it

Reviewer objections are **expert-written, pre-labelled gap statements, published**. When a
reviewer writes "the authors do not evaluate beyond 7B" or "no comparison against a
compute-matched baseline", that is a named anomaly you did not have to derive.

`api.openreview.net`, no credentials. Query a venue's submissions and read the review threads.

**Coverage boundary, and record it:** ICLR (thorough, many years), NeurIPS (recent years),
some ACL and many workshops. **CVPR, ICML and most journals are not there.** Say so in
`SEARCH-LOG.md` rather than letting a reader assume the reviews were checked and clean.

**Done when:** 15-30 papers are on the list, every one traceable to one of rules 1-5, and
`SEARCH-LOG.md` records every query, the date, and which sources were and were not covered.

## Phase 2 — Extract anomalies, not summaries

### Per paper, capture only what can seed an idea

Six fields. Nothing else. A summary is not one of them.

| Field | Why it is here |
|---|---|
| **Claim** | What the paper says is true |
| **Setting demonstrated in** | Dataset, scale, modality, budget. The scope of the claim as actually tested |
| **Strongest baseline beaten, and under what budget** | An unbudgeted comparison is not a comparison |
| **Limitation the authors name themselves** | Free, honest, and usually the most fertile line in the paper |
| **What reviewers attacked** | From OpenReview where available. Expert-labelled, already prioritised |
| **Rigor** | See below |

### Rigor appraisal, CS version

This is the correct ML translation of clinical risk-of-bias, and it is better than the original
because every item is checkable from the paper:

- **Reproducibility** — code and data available; fixed seeds; multiple runs; **variance reported**
- **Baseline fairness** — baselines strong and *correctly tuned*, with matched compute and data
  budgets. A tuned proposed method against a default-configured baseline is the commonest unfair
  comparison in the field
- **Benchmark validity** — appropriate datasets and metrics, no test-set leakage, honest protocol
- **Ablation coverage** — key design choices isolated and justified

Rate High / Moderate / Low. **Low-rigor papers are not excluded** — a weak paper making a strong
claim is itself an anomaly (pattern 4).

### Then, across papers: five patterns

Four are derived from actual ML papers ([2607.01233](https://arxiv.org/abs/2607.01233)); the fifth
is the one that produces non-incremental work.

| # | Pattern | What you are looking for |
|---|---|---|
| 1 | **Contradiction** | Two papers disagree on the same benchmark. Why? Different budget, different tuning, different split, or a real effect? |
| 2 | **Explanation gap** | Everyone reports it works. Nobody says why. The mechanism is folklore |
| 3 | **Scope mismatch** | The result exists only at one scale, one modality, one budget, one language. Prior work relies on a narrow assumption no located study tests outside |
| 4 | **Evidence gap** | The field asserts something it has no measurement for |
| 5 | **Assumption challenge** | What does *every* paper in this stack take for granted? The metric, the data distribution, the architecture family, the evaluation protocol |

**Pattern 5 is the one worth the most effort.** Gap-spotting is the dominant way research questions
get constructed, and precisely because it leaves the existing literature's assumptions unchallenged
it systematically produces incremental theory (Sandberg & Alvesson, *Organization* 2011). Patterns
1-4 find holes inside the field's frame. Pattern 5 questions the frame.

### One pattern is deliberately absent

**"Nobody has combined A and B" is not on this list, and must not be recorded as an anomaly.**

LLM-generated ideas are "disproportionately concentrated around bridge-like opportunities and
synthesis methods", with a range "narrower than, and systematically shifted relative to, human
research taste" ([2607.01233](https://arxiv.org/abs/2607.01233)). Combination is the shape a model
produces when it has nothing. It is also the shape that gets killed downstream by `idea-triage`'s
`SUBSUMED` and `DISCOUNT` codes. Do not manufacture it here and pay to kill it later.

**Done when:** every anomaly in `ANOMALIES.md` carries a pattern number, the paper(s) it came from,
and a one-line statement of what is unresolved. No anomaly is combination-shaped.

## Phase 3 — Bound every claim

For each anomaly that asserts something is *missing*:

- the **search that bounds it** — query strings, sources, date
- the **nearest adjacent work**, named, or an explicit "none located within this boundary"
- the phrasing: **"not located within the documented search boundary"**, never "nobody has"

**Done when:** `grep -in "nobody has\|no prior work\|never been\|first to" ANOMALIES.md
FIELD-MAP.md` returns nothing.

## Artifacts

`FIELD-MAP.md`, `ANOMALIES.md` and `SEARCH-LOG.md`, written to the **field** directory, not the
paper's — they outlive any one paper. In the research environment that is
`fields/<field-slug>/`; standalone, use `./<field-slug>/`.

```markdown
# FIELD-MAP: continual learning for VLMs
Generated 2026-08-20 · 24 papers · search log: SEARCH-LOG.md

## Priors  [FROZEN 2026-08-20T09:14Z — recorded before any search]
Want to be true: parameter-efficient CL beats replay without storing data.
Believe: (1) replay is the real baseline everyone under-tunes …
Would change my mind: a compute-matched replay baseline that closes the gap.

## What reading changed  [appended after Phase 2]
(2) was wrong — three papers do tune replay properly and it still loses. But all three use
the same eval protocol, which is now anomaly A7.

## The map
### Method families
### What everyone agrees on
### What is actually contested        ← the section that matters
### What the whole stack assumes      ← pattern 5 candidates

## Rigor distribution
High 6 · Moderate 13 · Low 5. The five Low all report single-seed results.
```

```markdown
# ANOMALIES: continual learning for VLMs

| ID | Pattern | Unresolved | From | Search boundary |
|----|---------|-----------|------|-----------------|
| A3 | 1 contradiction | Zhang'26 and Liu'26 disagree on the same split; budgets differ 8× | 2 papers | — |
| A7 | 5 assumption | Every paper evaluates task-incrementally; nobody tests the domain-incremental setting the deployment story needs | 24/24 papers | q="domain-incremental" + venue filter, 2026-08-20, arXiv+S2+OpenReview. Nearest adjacent: Wu'25 (mentions it, does not evaluate) |
| A9 | 2 explanation | Six papers report the frozen-backbone effect; none measures why | 6 papers | — |
```

## Reference

- [references/sources.md](references/sources.md) — the CS-native sources and how to query them,
  including the OpenReview recipe and its coverage boundary.

## Standalone behaviour

| | |
|---|---|
| **Wants from state** | nothing — this runs before a project exists |
| **Fallback** | Writes to `./<field-slug>/`. If `paper-library` has a local corpus, use it first |
| **Degrades without an environment** | The field map is directory-local rather than shared across papers |
| **Does not degrade** | Every phase. This is the most standalone skill in the sub-pack |
