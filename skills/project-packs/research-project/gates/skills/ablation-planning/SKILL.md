---
name: ablation-planning
description: >-
  Enumerates the ablations a paper actually needs, then costs and orders them against a compute
  budget and maps each to the claim it defends. Works from a taxonomy of twelve ablation kinds and
  from the ablation tables of the three nearest prior papers, rather than from the boxes in the
  architecture figure. Use when planning experiments or preparing for rebuttal: "该补哪些 ablation",
  "reviewer 会问什么消融", "消融实验怎么设计", "消融够不够", "which ablations do I need",
  "I have N GPU-hours left, what do I run", "what will Reviewer 2 demand". Flags every
  contribution-list claim that no planned ablation defends. Distinct from paper-stress-test, which
  names missing ablations as one bullet inside a rejection narrative without enumerating, costing
  or ordering them, and from experimental-design, which sets randomization and blocking for a run
  once its arms are chosen.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
compatibility: "offline — no scripts, no network, no credentials"
metadata:
  category: research
  tags: [ablation, rebuttal, compute-budget, claim-coverage, conference]
---

# Ablation planning

This skill produces a **plan**. It never reads a finished result table to interpret it — that is a
different question, asked at a different time.

State handling: [../idea-triage/references/state-contract.md](../idea-triage/references/state-contract.md).

## Procedure

### 1. List the claims to defend

Pull the contribution list from the draft, or `claims[]` from state. Each claim gets an ID, and its
mechanism clause isolated from its outcome clause.

**Done when:** every claim in the contribution list has an ID and an isolated mechanism clause.

### 2. Enumerate candidates by kind, not by module

Walk **all twelve kinds** in [references/ablation-kinds.md](references/ablation-kinds.md), in
order. Each yields at least one candidate, or a written "n/a, because —".

**Done when:** every one of the twelve kinds carries either ≥1 candidate or a written n/a reason.
*Narrow bridge — the taxonomy is walked in order, and silently skipping a kind is not available.*

**This step is the skill.** The default generator is the architecture figure, which produces kind 1
and stops. That is where the 29% comes from.

### 3. Read the neighbours' ablation tables

Take the **three** nearest prior papers — the ones related work already names, the ones a reviewer
in this subarea will have read. Extract every ablation they ran. List each one you have not
planned, with a keep-or-drop verdict and a reason.

Use `paper-library` if there is a local corpus; otherwise ask for three PDF paths and read them.

**Done when:** every ablation appearing in any of the three papers' ablation tables carries a
keep-or-drop verdict and a reason.

*High demand by design.* This is the criterion that forces the legwork, and no agent volunteers to
go read three competitors' tables and diff them against its own plan. Three, because that is how
many a reviewer from your subarea has actually read — not a tuning constant.

### 4. Fill both expected-result columns

For every candidate: what the result looks like **if the claim is true**, and what it looks like
**if the claim is false**. Both concrete, both with a direction and a rough magnitude.

**Done when:** both columns are filled for every candidate. **A candidate whose two columns read
the same cannot discriminate** — drop it, and record that as the reason.

This column pair is what makes an ablation a test rather than a decoration, and it is the direct
handshake with `falsification-design`'s severity check: same question, asked from the other end,
and it must use the same words or the handoff rots.

### 5. Cost and order

Each candidate gets a cost in GPU-hours and the claim it defends. Then order against the stated
budget:

> **Any ablation defending a claim that appears in the abstract runs first.**

Cut from the bottom.

**Done when:** every candidate has a cost, the cumulative cost of the run-list is ≤ budget, and the
ordering rule is visible in the artifact.

### 6. Coverage check, both directions

Map claims → ablations and ablations → claims.

- A claim with no planned ablation goes into an **Undefended claims** section, and its ID is pushed
  to `claim-calibration`.
- An ablation defending no claim is **cut**.

**Done when:** every claim ID appears either against ≥1 planned ablation or in the undefended list,
and every planned ablation names ≥1 claim.

## The artifact

`ABLATIONS.md`, beside the experiment:

```markdown
# Ablation plan — budget 200 GPU-h — target venue from state, or asked

| ID | Kind | Defends | Holds fixed | If claim TRUE | If claim FALSE | GPU-h | Order |
|----|------|---------|-------------|---------------|----------------|-------|-------|
| A3 | budget-matched | C1 | FLOPs ±5% | ΔF1 holds ≥1.5 | gain →0, it was compute | 36 | 1 |
| A7 | gradient-path | C1 | forward pass | detach drops to baseline | detach matches full | 18 | 2 |
| A11| negative control | C1 | method | no gain on head classes | gain appears on head classes | 12 | 3 |
| A4 | hyperparam attribution | C2 | sweep budget | baseline stays 3pt behind | baseline catches up | 60 | 4 |
| A9 | oracle ceiling | — | — | — | — | 24 | CUT — defends no claim |
Cumulative (1–4): 126 / 200 GPU-h

## From the neighbours (step 3)
Paper A Tab.5 ran an interaction ablation over stages — not planned. KEEP → A12.
Paper B Tab.7 ran a per-module latency ablation — DROP, no claim of ours depends on latency.
Paper C — no ablation table.

## Undefended claims  → claim-calibration
C3 "generalises beyond this benchmark" — no planned ablation. Add a second-benchmark arm, or
scope the claim.
```

## What makes this non-obvious

**Step 2's taxonomy and step 3's forced diff.**

Asked what ablations to run, a competent agent enumerates the named modules and proposes removing
each. That is kind 1, and it is the 29%. It will not, unprompted, propose a **budget-matched
control**, a **gradient-path** variant, or a **negative control** where the method *should* fail —
and the negative control is precisely what is missing when a result looks right for the wrong
reason.

Step 3 is legwork. Legwork only happens under a completion criterion that demands exhaustiveness,
which is why the "Done when" for it is written the way it is.

## Standalone behaviour

| | |
|---|---|
| **Wants from state** | `claims[]`, `preregistrations[].ablation_requests` |
| **Fallback** | Read the contribution list from the draft; glob `PREREGISTER-*.md` for requests; ask for compute budget and venue in one question. |
| **Degrades without an environment** | Claim IDs are local to the run rather than stable across skills, so the coverage map is re-derived next time instead of updated. Without a local paper corpus, step 3 costs the user three file paths. |
| **Does not degrade** | The twelve-kind walk and the neighbours' table diff — the two moves that carry the value. |
