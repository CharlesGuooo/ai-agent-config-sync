---
name: idea-forge
description: >-
  Turns a field's anomaly register into 3-8 candidate research ideas. Every candidate is traceable
  to a named anomaly and written in the exact form idea-triage consumes. Use after field-map, or
  whenever you have a pile of unresolved observations and need candidates: "从这些矛盾点里想几个方向",
  "能做什么", "给我几个候选", "what could I actually do with this", "turn these into ideas".
  Refuses two things on purpose — a candidate that cannot be traced to a specific anomaly, and a
  pool where every candidate is "combine A and B", which is the shape a model produces when it has
  nothing. Generates wide and does not select; selection is idea-triage's job and it belongs to a
  human. Distinct from hypothesis-generation, which starts from an experimental observation you
  already have rather than from the literature.
allowed-tools: Read, Write, Edit, Grep, Glob, AskUserQuestion
compatibility: "offline — reads the field map on disk; no network, no credentials"
metadata:
  category: research
  tags: [ideation, candidates, anomalies, divergence]
---

# Idea forge

Input: `ANOMALIES.md` and `FIELD-MAP.md` from `field-map`.
Output: 3-8 candidates in `idea-triage`'s step-1 format, nothing else.

State handling: [../idea-triage/references/state-contract.md](../idea-triage/references/state-contract.md).

**This skill diverges. It does not choose.** Generating wide with a machine and selecting with a
person is the arrangement the evidence supports: LLM ideas were judged *more novel* than expert
ideas in blind review, and human re-ranking of them improves feasibility — but their scores
collapse further than human ideas once executed. Generation is where the machine helps. Selection
is `idea-triage`, and there is a human in it.

## Procedure

### 1. Read the anomalies. Do not read the priors yet.

Load `ANOMALIES.md`. Do **not** open the Priors section of `FIELD-MAP.md` until step 5 — it exists
to be compared against, and reading it now makes the comparison worthless.

**Done when:** every anomaly is listed with its pattern number and source papers.

### 2. Work each anomaly with the lens its pattern deserves

One pass per anomaly. The pattern number chooses the lens; do not apply all six to everything.

| Pattern | Lens | The move |
|---|---|---|
| **1 contradiction** | Tension triage | Ask: **is this trade-off fundamental, or an artifact of current methods?** If artifact, the reconciliation is the contribution. If fundamental, characterising the frontier is the contribution. Either answer is a paper — this lens cannot dead-end |
| **2 explanation gap** | Mechanism isolation | What measurement would distinguish the folk explanation from the next most likely one? The measurement is the paper |
| **3 scope mismatch** | Boundary probe | Name the implicit assumption in the evaluation, violate it deliberately, and ask whether the failure is fundamental or fixable |
| **4 evidence gap** | Instrument-first | If the field asserts something it cannot measure, building the measurement is the contribution — and it is usually more citable than another method |
| **5 assumption challenge** | Hidden-constraint triage | List the stack's constraints and classify each **Hard** (logically necessary) / **Soft** (convention) / **Hidden** (not stated, assumed by everyone). Then relax or replace a Soft or Hidden one. **Exposing and dropping a hidden constraint is the most reliable route from incremental to transformational** |
| any | Strip the jargon | Restate the problem with no domain terms — "a system that must selectively aggregate from a large set where relevance is context-dependent and cost is quadratic" rather than "improve attention efficiency". Then ask who else has that problem. Analogies transfer at the level of mechanism or not at all |

**Done when:** every anomaly has produced at least one raw candidate, or a written reason it
produced none. *Open field on the generating, narrow bridge on the coverage.*

### 3. Check the timing window

For each raw candidate ask: **what changed that makes this feasible now?**

- Requires something that does not exist yet → park it, say so.
- Could have been done five years ago → someone probably did. Go and check before proposing it.
- **Became feasible in roughly the last 6-18 months** → that is the window.

This is the only concrete novelty heuristic in use here, and it is a question about the world
rather than a rating of the idea. It also predicts scoop risk directly: a candidate that opened up
eighteen months ago has competitors.

**Done when:** every surviving candidate names the enabler and when it landed.

### 4. Apply the two refusals

**Refusal 1 — no untraceable candidates.** Every candidate cites the anomaly ID it came from. A
candidate you cannot trace is a candidate you invented from the prior distribution, and that is
exactly the failure mode this skill exists to avoid. **Drop it. Do not backfill a justification.**

**Refusal 2 — refuse a combination-shaped pool.** If every surviving candidate is of the form
"apply A to B" or "combine A and B", **stop and report the refusal instead of emitting the pool.**

LLM ideas are "disproportionately concentrated around bridge-like opportunities and synthesis
methods", with a range narrower than and systematically shifted from human research taste
([2607.01233](https://arxiv.org/abs/2607.01233)). An automated system classified *micro-batching
for SGD* — 2018 — as novel because a keyword search returned nothing
([2502.14297](https://arxiv.org/html/2502.14297v2)). A pool that is all combinations means the
anomaly register was too thin to work from, not that the field is full of combinations waiting to
be made.

Recovery: go back to `field-map` and look harder at pattern 5. Assumption challenges are what the
register is usually missing when this fires.

**Done when:** every candidate has an anomaly ID, and at least one candidate is not
combination-shaped.

### 5. Now open the priors, and diff

Read `FIELD-MAP.md` § Priors — the beliefs recorded before any searching.

For each candidate, mark one:

- **CONFIRMS** a prior — you already thought this. Fine, but it is not what reading bought you.
- **CONTRADICTS** a prior — the literature says something you believed is wrong. **These are the
  valuable ones.** Flag them.
- **NEITHER** — you had no view. Also valuable; it is genuinely new ground.

**A pool that is entirely CONFIRMS means the reading did not do any work**, and the run should say
so out loud rather than presenting an anchored pool as a discovery.

**Done when:** every candidate carries one of the three marks, and the balance is stated.

### 6. Write the pool in idea-triage's format

Exactly the shape its step 1 expects — `ID`, a claim as **"X causes/enables Y in setting Z"**, and
a provenance line. No scores. No ranking. No recommendation.

**3-8 candidates.** Below three, the anomaly register was too thin — go back. Above eight,
`idea-triage` caps at six for the tournament anyway, so cut the weakest yourself and say which.

**Done when:** the file can be handed to `idea-triage` with no reformatting, and contains no
numeric score anywhere.

## The artifact

`ideas/CANDIDATES-<date>.md`, in the **project**, not the field directory — a field map is shared
across papers, a candidate pool belongs to one decision.

```markdown
# Candidates — continual learning for VLMs — 2026-08-20
From ANOMALIES.md (11 anomalies) · field map: fields/cl-vlm/

| ID | Claim | From | Enabler | vs priors |
|----|-------|------|---------|-----------|
| I1 | Evaluating domain-incrementally rather than task-incrementally reverses the reported ranking of PEFT and replay methods on VLM continual learning | **A7** (pattern 5) | nothing new needed — the assumption was never tested | **CONTRADICTS** prior (2) |
| I2 | The frozen-backbone gain comes from feature reuse, not from reduced interference, in low-data regimes | **A9** (pattern 2) | cheap probing at scale, ~12 months | NEITHER |
| I3 | Compute-matched replay closes the gap that motivates most PEFT continual-learning work | **A3** (pattern 1) | — | **CONTRADICTS** prior (1) |

## Balance
3 candidates · 2 CONTRADICT a prior, 1 NEITHER, 0 CONFIRMS.
Reading did real work.

## Not emitted
Two raw candidates were combination-shaped ("apply LoRA-style routing to replay buffers") and
were dropped under refusal 2 rather than padding the pool.
```

## What this skill will get wrong if you let it

**It will drift toward the recommendation.** Every instinct says to end with "I'd suggest I1."
Do not. `idea-triage`'s whole design — pairwise only, no absolute scores anywhere, a forced kill —
exists because a ranked list is the shape that never actually kills anything. Handing it a
pre-ranked pool defeats it before it starts.

## Standalone behaviour

| | |
|---|---|
| **Wants from state** | `ideas[]` for prior kills — a candidate matching a killed idea should be flagged, not silently re-proposed |
| **Fallback** | Glob `ideas/TRIAGE-*.md` for prior kill lists. Absent those, skip the check and say so |
| **Degrades without an environment** | Cross-project kill memory only |
| **Does not degrade** | Everything else. The anomaly register on disk is the real input |
