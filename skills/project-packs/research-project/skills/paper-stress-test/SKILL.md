---
name: paper-stress-test
description: >-
  Adversarially stress-test YOUR OWN paper draft before submission — as the
  harshest fair reviewer would. Use before submitting to a venue or sending to an
  advisor: "stress-test my paper", "what would a harsh reviewer say", "find the
  holes before submission", "claim audit", "is every claim supported", "red-team
  my paper", "will this get rejected". Runs three passes: claim-audit (every claim
  traceable to evidence), Devil's-Advocate (strongest rejection a reviewer could
  write), and AI-venue norms (soundness / novelty / reproducibility / limitations).
  This is pre-submission self-defense, distinct from peer-review (you reviewing
  someone else against a checklist) and scientific-critical-thinking (grading
  evidence quality of a claim/body of work).
metadata:
  category: research
  tags: [peer-review, adversarial, claim-audit, pre-submission, neurips]
---

# Paper Stress Test (adversarial self-review)

Goal: surface every rejection reason *before* a reviewer does, so you can fix it.
Be ruthless and specific — vague praise is useless here. Work from the actual draft
(`.tex`/`.pdf`/`.md`); quote line/section locations for every issue.

Run three passes, then synthesize a prioritized fix list.

## Pass 1 — Claim audit (is every claim earned?)
Extract each **substantive claim** (contributions, "we show/prove/achieve", SOTA
assertions, generalization claims, efficiency claims). For each, classify the support:

- **Supported** — backed by an experiment (which table/figure?), a proof, or a citation.
- **Under-supported** — partial evidence, narrow setting, or a single seed/dataset.
- **Unsupported / overclaim** — no evidence, or the evidence doesn't match the claim's
  scope (e.g. "robust in the wild" from one clean benchmark; "real-time" without latency
  numbers on the stated hardware).

Output a table: `claim | location | support type | evidence ref | verdict`. Flag every
under-/un-supported claim — these are the reviewer's easiest attack and the cheapest to
fix (soften the wording or add the experiment).

## Pass 2 — Devil's Advocate (write the rejection)
Adopt a hostile-but-fair Reviewer 2. Write the **strongest reject case** you honestly
can, covering:
- The one-sentence "why this is rejected" a reviewer would put first.
- Missing baselines / unfair comparisons (tuned-yours vs default-theirs, different data,
  missing the obvious strong baseline).
- Confounds and ablations not run (what change actually caused the gain?).
- Hidden assumptions and failure modes the paper avoids showing.
- "Delta too small / not novel" — what prior work makes this incremental, and the
  rebuttal you'd need.
For each attack, note the **cheapest credible defense** (an ablation, a citation, a
scoped claim) so the list is actionable, not just demoralizing.

## Pass 3 — AI-venue norms (NeurIPS/CVPR/ICML/ICLR framing)
Score and justify (not med/CONSORT checklists — AI conference reviewer guidelines):
- **Soundness** — are the claims supported by correct, adequate experiments/theory?
- **Novelty / significance** — what is genuinely new vs. recombination; who cares?
- **Reproducibility** — could a reviewer rerun this? (code, configs, seeds, hardware,
  data access — cross-check with the `repro-pack` skill).
- **Clarity** — is the contribution legible by the end of page 1?
- **Limitations & ethics** — are limitations stated honestly (reviewers now expect this
  explicitly); any broader-impact/ethics gaps.

## Synthesis — prioritized fix list
Produce a ranked list: **blocking (will cause reject) → important → polish**, each with
the location, the fix, and rough effort. Lead with the single thing most likely to sink
the paper. End with an honest 1-line verdict: "as-is, this reads as a {reject / borderline
/ accept} because {reason}."

## Notes
- Cross-checks: use `claim` flags against `citation-management` (do the cited works say
  what you claim?) and `repro-pack` (is the reproducibility claim real?).
- Stay fair: the point is to harden a real contribution, not to nuke good work. Separate
  "fatal" from "a reviewer might grumble".
