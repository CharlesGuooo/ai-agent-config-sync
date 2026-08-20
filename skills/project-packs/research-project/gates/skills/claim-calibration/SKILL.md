---
name: claim-calibration
description: >-
  Decides what your results license you to say, and sets that as the ceiling before the abstract is
  written. Grades every claim on three separate axes — outcome (does the number exist), mechanism
  (does any measurement distinguish your stated cause from the nearest rival), and honesty (is the
  claim's failure region stated anywhere) — and resolves every headline number to the file on disk
  that produced it. Use once results are in: "结果出来了,我能说到什么程度", "这个说法过头了吗",
  "是不是 over-claim", "what am I allowed to claim", "can I say the method causes X", "which of
  these numbers can go in the abstract". Distinct from paper-stress-test, which audits a finished
  draft for whether evidence exists, and from academic-humanizer, which words a claim once its
  ceiling is known — this skill sets the ceiling those two work beneath.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
compatibility: "offline — grep over local results; no network, no credentials"
metadata:
  category: research
  tags: [claims, mechanism-fidelity, provenance, over-claim, gate]
---

# Claim calibration

State handling: [../idea-triage/references/state-contract.md](../idea-triage/references/state-contract.md).

## Why this is not already covered

Take a real sentence:

> "The reweighting term **lets the model concentrate capacity on rare events**, improving
> rare-event F1 by 4.2 points (Table 3)."

Run it past everything this pack already has:

| Existing check | Verdict |
|---|---|
| `paper-stress-test` pass 1 | **Supported** — Table 3 exists |
| `claim-evidence-contract` ladder | **`strong`** — metric plus table, boundary explicit |
| `over-claim-guard` | clean — "improving" sits on the right rung |
| `academic-humanizer` layer 4 | passes — no verb stronger than its evidence |

**All four pass.** And the mechanism clause — *"lets the model concentrate capacity on rare
events"* — has zero evidence behind it. Nobody measured the capacity allocation. The number
supports an **effect**; the sentence asserts a **mechanism**.

Every existing check grades one axis: does evidence exist for the outcome, and does the verb match
its strength. Neither question can see this. Across 28 coding-agent episodes, **7 reached
right-looking results through reasoning that broke under changed conditions**, and one defended its
conclusion with physics inconsistent with its own data ([2606.23175](https://arxiv.org/abs/2606.23175)).
Their prescription is the design of this skill: score task outcome, mechanism fidelity and
epistemic honesty **separately**, and never average them.

## Procedure

### 1. Split every claim

Each claim splits into an **outcome clause** (what changed, measurably) and a **mechanism clause**
(why it changed, causally). Many sentences carry both while only one is defended.

**Done when:** every claim in the abstract, introduction and contribution list is split; a claim
with no mechanism clause is marked `M: none` rather than skipped. *Narrow bridge — the split is
mechanical.*

### 2. Resolve the numbers to disk

Every number in the abstract, intro and contribution list must resolve to **a file on disk** — not
"Table 3", but the artifact that produced Table 3.

```bash
grep -rn "4.2\|0.042" results/ outputs/ --include="*.json" --include="*.csv" | head
```

**Done when:** every headline number carries a `path:line` provenance, or is marked `UNRESOLVED`.
*Narrow bridge.*

Experiment-results hallucination was found in **80% of Claude Code tasks** in one harness
([2505.19955](https://www.emergentmind.com/papers/2505.19955)), and its canonical form is a table
entry that does not match the log. Every neighbouring check stops at "cite the table" — but the
table is inside the paper, and **a fabricated number cites a table perfectly.**

### 3. Grade O — outcome

Apply the existing ladder — `unsupported | observed | supported | strong` — defined in
`latex-paper-en/references/evidence/claim-evidence-contract.md`, which lives in the
`manuscript/` sub-pack. Read it there; do not restate it here.

(A relative link is deliberately not used: `gates/` and `manuscript/` are separate sub-packs, and
once synced there is an agent directory between them, so a path that resolves in the repository
would not resolve on disk.)

**Done when:** every outcome clause carries a rung and its evidence anchor.

### 4. Grade M — mechanism

For each mechanism clause, **name the nearest rival mechanism** — the other explanation that would
produce the same number — then ask whether any measurement in the paper distinguishes yours from
it.

| Grade | Meaning |
|---|---|
| `measured` | An ablation or direct measurement excludes the rival. Name it. |
| `asserted` | No measurement discriminates. Name the rival that survives. |
| `none` | There is no mechanism clause. |

**Done when:** every mechanism clause carries a grade and a named rival. *Open field on generating
rivals, narrow bridge on the grade vocabulary.*

> **An `M: asserted` claim has no wording fix.**
>
> Softening *"lets the model concentrate capacity"* to *"may let the model concentrate capacity"*
> still asserts an unmeasured mechanism, only less legibly. Exactly two fixes exist: **run the
> discriminating ablation** (`ablation-planning`, kinds 8 and 10), or **delete the mechanism
> clause.**

That warning is here because reaching for the verb ladder is the trained reflex at this point, and
it is the wrong instrument. This is not a claim that is too strongly worded. It is a claim about
something nobody measured.

### 5. Grade H — honesty

For each claim, find the sentence in the paper naming a condition under which it does not hold. If
the limitations section does not mention this claim: `H: unbounded`.

**Done when:** every claim carries `H: bounded` with a location, or `H: unbounded`.

The one system that held coherence over ~200 research rollouts self-reports **85.5% accuracy on
data-analysis claims against 57.9% on interpretation and synthesis**
([2511.02824](https://arxiv.org/abs/2511.02824)). That 28-point gap lives in claims whose failure
region was never stated.

### 6. Check the preregistration

For any claim with a registered kill threshold: **was it crossed?**

A crossed threshold with a surviving claim is a **blocking** finding. Any excuse being offered is
checked against the closed admissible-excuse list from `falsification-design` step 5.

**Done when:** every claim carries `threshold: met | crossed | none registered`, and every
`crossed` carries either an admissible excuse from the closed list or a retirement. `none
registered` is reported as a gap, never omitted.

This is where the honesty axis stops being a judgement call and becomes a lookup, and it is the
load-bearing reason `falsification-design` exists.

### 7. Write the licensed restatement

For each claim, the strongest sentence the evidence actually licenses.

**This wording is the ceiling.** `academic-humanizer`, `paper-writing` and `latex-paper-en` word
*beneath* it; they do not renegotiate it.

**Done when:** every claim has a licensed sentence, and every `M: asserted` claim's licensed
sentence contains no mechanism clause.

### 8. Present the gate

**Done when:** a verdict per claim is recorded, every override carries the author's stated reason,
or the artifact is marked `OPEN`.

## The artifact

`CLAIMS-LICENCE.md`:

```markdown
# Claim Licence — results as of run 18 — 2026-08-20

| ID | Claim (abridged) | O | M | H | Number → disk | Prereg |
|----|------------------|---|---|---|---------------|--------|
| C1 | L_rw → capacity on rare events, +4.2 F1 | strong | **asserted** (rival: extra capacity — A3 not yet run) | unbounded | results/run18/stats.json:41 | met |
| C2 | transfers across carrier models | observed | none | bounded §6 | results/run12/stats.json:18 | none registered |
| C3 | generalises beyond this benchmark | **unsupported** | none | unbounded | **UNRESOLVED** | crossed |

## C1 — licensed restatement
> "Adding L_rw improves rare-event F1 by 4.2 points on this benchmark (Table 3). The improvement
> does not appear on the head classes."

Removed: "lets the model concentrate capacity on rare events."
To license the removed clause, run A3 (budget-matched) and A7 (gradient-path).

## C3 — BLOCKING
Kill threshold in PREREGISTER-C3.md was crossed (Δ = 0.4 pt < 1.0 pt, CI covers zero).
No number in the draft resolves to disk. The excuse offered — "needs more seeds" — is admissible
once under the closed list, and only if the 3-seed spread is inside the threshold. It is not.
Retire C3, or run the second-benchmark arm.

## Decision
C1 [ ] approve  [ ] override → reason: ______
C2 [ ] approve  [ ] override → reason: ______
C3 [ ] retire   [ ] override → reason: ______
Status: OPEN
```

## When the human rejects

Two rejections, two different paths.

**1. They supply evidence the skill did not find.** Re-grade that claim only, and write the
evidence pointer into the artifact so the next run finds it unprompted. A missed anchor is a lookup
bug, not a disagreement.

**2. They insist on the stronger wording anyway.** Record `author_override` with their stated
reason and a `risk` note naming the rival mechanism that survives. **The claim ships with the
stronger wording** — and the override becomes input to `paper-stress-test` pass 2 as a known attack
surface, and to `auto-review-loop`'s expected-weakness list.

An override is not a failure of the gate. It is the gate doing the only thing that matters: making
a decision to overclaim explicit, dated, and attached to the rebuttal prep. Nothing is silently
accepted, and nothing is silently blocked.

## What makes this non-obvious

**Step 4 — grading the mechanism clause against a named rival, and refusing the wording fix.** A
competent agent asked "is this over-claimed" reaches for the verb ladder, because every skill it
has seen says the fix for a strong claim is a weaker verb. Distinguishing *the effect is real and
the stated cause is unmeasured* from *the verb is too strong* is a different question with a
different remedy.

**Step 2 — provenance to disk.** Neighbours stop at the table reference. A fabricated number cites
a table perfectly.

**Step 6 — reading back the preregistration.** No agent does this unprompted, because it requires
having written one.

## Standalone behaviour

| | |
|---|---|
| **Wants from state** | `preregistrations[]` (`kill_threshold`, `admissible_excuses`), `ablations[].result_ref` |
| **Fallback** | Glob `PREREGISTER-*.md` and `ABLATIONS.md` and parse their tables. Absent both, step 6 reports `none registered` per claim as a stated gap. |
| **Degrades without an environment** | Step 6 needs a preregistration to exist *somewhere on disk*; the state store only makes finding it faster. Where none exists at all, honesty falls back to the H grade alone, and the artifact says so. |
| **Does not degrade** | The O/M/H split, the named-rival requirement, number provenance to disk, the licensed restatement, the override record. |
