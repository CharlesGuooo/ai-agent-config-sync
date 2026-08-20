---
name: falsification-design
description: >-
  Fixes the result that would end the claim, before the experiment runs. Produces a numeric kill
  threshold in the actual metric, a closed list of which excuses will be admissible when it fails,
  and the data held out of sight until the decision. Use before launching a run or a phase:
  "跑之前先定什么结果算失败", "怎么算失败", "预注册一下", "what result would kill this idea",
  "preregister this", "am I going to be able to explain this away", "what would falsify this".
  Emits a frozen PREREGISTER file stamped with the repository commit, amended only by dated
  append. Distinct from experimental-design, which sets randomization, replication and blocking —
  this skill adds only the commitment layer on top of a design that already exists — and from
  hypothesis-generation, which scores falsifiability as one criterion among several while choosing
  between competing hypotheses.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
compatibility: "offline — git and file reads only; no network, no credentials"
metadata:
  category: research
  tags: [preregistration, falsification, severity, kill-threshold, held-out]
---

# Falsification design

**Severity** (Mayo): a test is severe if it would probably have failed had the claim been false.
Everything below serves that one idea.

State handling: [../idea-triage/references/state-contract.md](../idea-triage/references/state-contract.md).

## Scope — read this before anything else

This skill contains **only the three moves no neighbour has**. It is deliberately small, and the
scoping is what keeps it from being 70% duplication:

| Not this skill | Goes to |
|---|---|
| Randomization, blocking, replication, design type | `experimental-design`, same sub-pack |
| Sample size, power | `statsmodels.stats.power` in `~/data-analysis-project/`, or G*Power |
| Which ablations discriminate the mechanism | `ablation-planning`, same sub-pack |

If the request is "how should I design this experiment", you are in the wrong skill. Come back
once a design exists and it needs a commitment attached.

## Procedure

### 1. State the claim under test

One sentence: *"X causes/enables Y in setting Z."*

**Done when:** the sentence names a mechanism (X), an observable (Y) and a scope (Z), and every
clause maps to something measurable. A clause that does not map is cut, or promoted to its own
claim.

### 2. Fix the estimator

Metric, dataset, subset, unit of analysis, n, aggregation. All six, in writing.

**Done when:** all six are written. **If the unit of analysis is finer than the unit the claim is
about** — per-frame when the claim is about scenes, per-token when it is about documents — stop
and hand off to `experimental-design`. That is pseudoreplication, which it names as the fatal
error. *Narrow bridge on the handoff condition.*

### 3. Write the kill threshold

An inequality, with a number and a unit, in the metric from step 2, such that a result on the
wrong side of it ends the claim.

> If ΔF1 on the rare-event subset is < 1.0 point across 3 seeds with the 95% interval covering
> zero, the reweighting claim is dead and this becomes an analysis paper.

Then ask one question, and wait for the answer:

> **Would you actually abandon the claim at that number?**

A "no" means the threshold is wrong, not that the question is wrong. Rewrite until the answer
is yes.

**Done when:** an inequality with a number and a unit exists, and the user has answered yes.
*Narrow bridge — the form is fixed and the confirmation is required.*

This is the step a model will not do unassisted. Left alone it writes *"if results are not
significant we will reconsider"*, which commits to nothing and cannot be violated.

### 4. Severity-check each planned comparison

For each comparison, answer in writing: **what else could produce this result?**

Then the severity question: *if the mechanism claim were false but the method still improved the
metric, would this comparison still pass?* If yes, the comparison is not severe — it cannot
distinguish the story you want to tell from the boring one.

Every non-severe comparison is either dropped, or paired with the ablation that excludes the rival
explanation. Write that ablation as a request for `ablation-planning` to plan and cost.

**Done when:** every planned comparison carries a written rival-explanation list, and every
comparison with an unexcluded rival carries an ablation request ID. *Open field on generating
rivals, narrow bridge on the exit condition.*

### 5. Pre-register the excuse list

List the excuses you will be tempted to make when the result comes back on the wrong side, and
decide **now**, for each, whether it is admissible and what evidence would license it. Then the
list is closed: an excuse not on it is inadmissible after the fact without a dated amendment.

Three always apply. They are the floor, not the target:

| Excuse | Admissible? | Licensing evidence, fixed now |
|---|---|---|
| "the baseline was under-tuned" | yes | only if the baseline's sweep budget ≥ ours, logged in `configs/` |
| "wrong subset" | no | the subset was fixed in step 2; a different subset is a new claim |
| "needs more seeds" | yes, once | only if the 3-seed spread is inside the threshold — i.e. the effect is genuinely inside the noise |

**Done when:** every excuse carries an admissibility verdict and, where admissible, its licensing
evidence; the list is marked `CLOSED`.

*This framing is invented rather than borrowed.* It descends from preregistration's
planned-versus-exploratory split, but stated as a pre-committed list of rationalisations it is not
something I found in the literature. It exists because agents and authors alike respond to a
disappointing result with an unimaginative excuse, and the cheapest defence is to have written the
excuses down while still optimistic.

### 6. Lock the split

List, by path, the data that must not be looked at until the decision. Then record the state
cheaply:

```bash
git rev-parse HEAD
git status --porcelain
```

Two commands, no pipes — identical behaviour on every shell the five agents run. **No git
repository?** Record instead the file count and newest modification time of the code directory, and
say in the artifact that the freeze is weaker.

**Also name the data on which iteration is explicitly free.** Without that sentence the lock reads
as a ban on exploration, and it is not one — the generating data is exactly where you should be
poking around.

**Done when:** every held-out path is listed with forward slashes, the stamp is recorded, and the
working tree is either clean or its dirt is explained.

### 7. Freeze

**Done when:** `PREREGISTER-<claim-id>.md` exists, carries the stamp and a timestamp, and the state
store's entry (if any) points at it. Later changes are **dated appended amendments with a reason**.
The original text is never edited in place. *Narrow bridge.*

## The artifact

```markdown
# Preregistration — C1
Frozen: 2026-08-20T14:20Z · repo @ a3f19c2 · working tree clean

## Claim
The reweighting term L_rw causes the model to allocate capacity toward rare events,
on the rare-event subset of the benchmark.

## Estimator
F1 · benchmark val split · rare-event subset · unit = sequence · n = 412 × 3 seeds ·
aggregation = per-sequence mean, then mean ± 95% CI over seeds

## Kill threshold
ΔF1 < 1.0 point with 95% CI covering zero  →  claim dead; paper becomes an analysis paper.
Author confirmed abandonment 2026-08-20.

## Severity
| Comparison | Rival explanations | Severe? | Excluding ablation |
|---|---|---|---|
| L_rw vs plain objective | extra capacity; longer schedule; LR difference | no | A3 (budget-matched), A7 (gradient-path) |

## Admissible excuses  [CLOSED]
[the table from step 5]

## Held out until decision
data/val_rare/**   ·   outputs/phase_2*/  (not yet created)
Free to iterate on: outputs/phase_1*/ , configs/probe.yaml

## Ablation requests  (consumed by ablation-planning)
A3 budget-matched · A7 gradient-path

## Amendments
(none)
```

Not a human gate — but step 3 contains a required confirmation, and that is where the pressure is.

## What makes this non-obvious

**Step 5, and step 3's refusal to accept a hedge.** Asked to design an experiment, a competent
agent produces baselines, metrics, seeds and a significance test. That is a good design. It will
not write down in advance the excuses it intends to make, nor commit to a number at which the
author walks away. Both are commitments, and commitment is the behaviour models are least likely to
volunteer.

**Step 6** is the second: an agent will readily suggest a train/val split, but will not name
specific paths as forbidden-until-decision and stamp the repository so the plan can later be proven
to predate the result.

## Standalone behaviour

| | |
|---|---|
| **Wants from state** | `claims[]` — id and text |
| **Fallback** | Read the claim from the draft, or ask. Write ablation requests into the artifact's own section rather than into `ablations[]`. |
| **Degrades without an environment** | Almost nothing. This is the most standalone of the four: it reads local files and stamps a local repository. Without git the freeze weakens to a directory manifest, and the artifact says so. |
| **Does not degrade** | Kill threshold, severity check, excuse list, split lock, freeze. All of it. |
