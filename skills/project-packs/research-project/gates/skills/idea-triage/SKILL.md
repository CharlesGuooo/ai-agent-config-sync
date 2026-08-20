---
name: idea-triage
description: >-
  Decides which research idea to commit to by eliminating the rest. Emits a written kill list with
  reason codes and resurrection conditions, from a pairwise tournament — never a ranked score
  table. Use when several candidate directions compete for one slot before a deadline:
  "选哪个方向", "帮我砍掉一半", "我只能做一个", "这几个 idea 哪个能成", "which idea should I do",
  "should I drop this direction", "which of these is worth a paper". Judges each idea by the paper
  it would produce if the experiment merely works as expected, not by how it reads at proposal.
  Closes on a human decision, and records overrides and prior kills so a dead idea cannot quietly
  return. Distinct from the global brainstorming skill, which generates candidates and must not be
  asked to kill them, and from hypothesis-generation, which formulates and scores hypotheses from
  observations rather than choosing between competing projects.
allowed-tools: Read, Write, Edit, Grep, Glob, AskUserQuestion
compatibility: "offline — no scripts, no network, no credentials"
metadata:
  category: research
  tags: [selection, kill-gate, pairwise, ideation-execution-gap, deadline]
---

# Idea triage

**Triage**, deliberately, and not "ranking" or "prioritisation". Triage already means sorting under
scarcity *including a do-not-treat verdict*. Ranking carries no such sense, which is exactly why an
agent asked to rank will produce an ordered list and never actually kill anything.

State handling: [references/state-contract.md](references/state-contract.md).

## Why judge the discounted idea

43 experts each spent 100+ hours executing a randomly assigned research idea. LLM-generated ideas
scored **5.38 on novelty at proposal and 3.41 after execution** — falling significantly further
than human ideas on *every* metric, erasing the entire ideation-stage advantage
([2506.20803](https://arxiv.org/abs/2506.20803)).

An idea's proposal-time appeal is not evidence about the paper it becomes. Step 4 exists to
estimate the 3.41 figure while the choice is still cheap.

The same work found that **human re-ranking of AI ideas improves feasibility.** So: generate wide
with the machine, select with a person. That is what this gate is.

## Procedure

### 1. Assemble the pool

Each candidate gets an ID, a claim in the form *"X causes/enables Y in setting Z"*, and a
provenance line saying whose idea it was and where it came from.

**Done when:** every candidate has an ID, a claim sentence naming a mechanism and an observable,
and a provenance line. *Open field* — the pool comes from wherever it comes from.

### 2. Merge duplicates

Two candidates are one candidate when **one experiment would test both**. Merge them and keep both
claim sentences under one ID.

**Done when:** no two survivors would be tested by the same experiment. *Narrow bridge — the test
is the experiment, not the wording.*

An unmerged pool splits the vote and inflates its own size. Six ideas that are really four produce
a survivor chosen against phantom competition.

### 3. Inject the rival

Add at least one candidate the user did not author: **the strongest thing a competing group could
publish in this space within roughly two conference cycles.** Source it to a named paper or a named
group — `paper-library` over a local corpus is enough, or `paper-lookup` if there is none.

**Done when:** the pool contains ≥1 candidate with external provenance, named to a specific paper
or group.

*This replaces a kill quota.* A quota would be a number with no justification behind it. The rival
does the same work honestly: ideas are otherwise compared only against each other and never against
what the field will actually put beside them, and a pool with a real rival in it produces kills
without being told to.

### 4. Write the execution-discounted restatement

For each candidate, write the paper's headline sentence **in the past tense, assuming the
experiment simply works as expected** — a plausible, unremarkable positive result, not the best
case — with a placeholder number of the magnitude you actually expect.

> **I4 at proposal:** "A reweighting term lets the model concentrate capacity on rare events."
>
> **I4 discounted:** "Adding `L_rw` improved rare-event F1 by ~3 points; the gain did not appear on
> the head classes."

Every later comparison judges the discounted sentence. **The proposal sentence is not used again.**

**Done when:** every candidate has a past-tense discounted headline containing an expected
magnitude, written by the agent without asking the user to supply it. *Narrow bridge — the form is
fixed.*

### 5. Run the pairwise tournament

Round-robin over the pool. For each unordered pair, name a winner and one clause giving the
deciding dimension.

**No absolute score appears anywhere in the record.** Not a novelty rating, not a feasibility
score, not a total. If you find yourself adding a 1–5 column, stop — that is the shape of answer
you have seen most often, not the one this procedure asks for.

Cap the pool at six before pairing: fifteen pairs, which is where the whole matrix still fits one
reading. Over six, apply steps 2 and 3 again, then drop any candidate whose discounted headline
would not be publishable at the target venue at all, and pair what remains.

**Done when:** every unordered pair has a winner and a deciding-dimension clause, and no absolute
score appears in the record. *Narrow bridge.*

### 6. Kill, with reasons and resurrection conditions

Everything that is not a survivor goes on the kill list with a reason code and a **resurrection
condition** — the specific, checkable observation that would license reopening it.

| Code | Meaning |
|---|---|
| `DISCOUNT` | The discounted headline is not publishable at the target venue |
| `RIVAL` | The injected rival dominates it on its own strongest dimension |
| `UNFALSIFIABLE` | No result would distinguish success from failure |
| `COST` | Cannot finish before the deadline at the stated resources |
| `UNDEFENDABLE` | The mechanism claim cannot be isolated by any affordable experiment |
| `SUBSUMED` | A survivor's experiment already answers it |

The vocabulary is closed so kills are comparable across runs and across papers.

**Done when:** the kill list is non-empty; each entry carries a code, the pair(s) it lost, and a
resurrection condition an observation could satisfy. **An empty kill list means the pool was not
competitive** — return to step 3 and add a second rival.

### 7. Check the graveyard

Read prior kills — `ideas[]` from state, or by globbing `ideas/TRIAGE-*.md`. Flag any candidate
matching a previous `killed` entry, with its prior reason and its unmet resurrection condition.

**Done when:** every candidate has been checked against prior kills, and the artifact states which
source answered — state store, globbed artifacts, or "no prior record found".

Same guard `auto-review-loop` applies to rejected fixes, one level up: applied to directions
instead of edits.

### 8. Present the gate

**Done when:** the human's verdict — approve / reject / amend — is written into the record verbatim
with a timestamp, or the artifact is marked `OPEN` with the question stated.

## The artifact

`ideas/TRIAGE-YYYY-MM-DD.md`, in this order and with nothing above it:

```markdown
## Survivor
**I2 — reweighting term as a drop-in loss**
Discounted: "Adding L_rw improved rare-event F1 by ~3 points, with no gain on head classes."
Won 4/4. Deciding dimension in 3 of them: the claim survives if the carrier-model migration fails.

## Killed
| ID | Idea | Code | Lost to | Resurrection condition |
|----|------|------|---------|------------------------|
| I1 | full two-stage system | RIVAL | I2, R1 | A closed-loop result the modular version cannot produce |
| I4 | the reweighting term as its own paper | SUBSUMED | I2 | I2's ablation comes back negative for that term |
| I5 | port to the second benchmark | COST | I2, I3 | Deadline moves a cycle, or the port lands upstream |

## Rival injected
R1 — "a trivial baseline closes most of the reported gap on this benchmark" (Smith et al., 2026).
Beat I1 and I5. Lost to I2 on scope.

## Pairwise matrix
[15 rows: pair | winner | deciding dimension]

## Graveyard
Checked against ideas/TRIAGE-2026-03-11.md (globbed; no state store present).
I4 was killed 2026-03-11 as RIVAL. Its resurrection condition is still unmet.

## Decision
[ ] approve   [ ] reject   [ ] amend   —  ________________
Status: OPEN
```

## When the human rejects

A rejection is **data about the ranking function**, not a request to re-rank.

1. Ask for exactly one thing: **which pair would you flip, and why.** One question — not a
   re-elicitation of preferences.
2. Record it as `human_override`, naming the flipped pair and the stated reason.
3. Recompute **only the pairs the flip touches.** The rest of the matrix stands.
4. If the flip promotes a killed idea, its kill entry stays in the record with `overridden_by`.
   The graveyard is append-only, so step 7 can still see it next time.
5. **No named pair, no close.** The artifact stays `OPEN`. A record is never closed on an
   unrecorded preference.

The accumulated flips are the asset. Human re-ranking is the intervention that measurably improves
feasibility; a flip log is that improvement made durable across your two or three concurrent
papers, instead of evaporating with the session.

## Standalone behaviour

| | |
|---|---|
| **Wants from state** | `ideas[]` for prior kills, `venue_target.deadline` |
| **Fallback** | Glob `ideas/TRIAGE-*.md` and parse the Killed tables. Absent those, skip the graveyard check and say so in the artifact. Ask for deadline and resources in one question. |
| **Degrades without an environment** | Kill memory is directory-local rather than cross-project, and the gate is advisory — write `Status: OPEN` and say in the reply that nothing is being blocked. |
| **Does not degrade** | Dedup, rival injection, the discounted restatement, the tournament, the kill list, the resurrection conditions. The entire method. |
