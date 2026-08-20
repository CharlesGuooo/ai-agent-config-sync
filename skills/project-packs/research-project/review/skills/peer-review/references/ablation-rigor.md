# Ablation and baseline rigor (ML)

> **Parked here.** This is the ML-specific rigor content that was written into the former
> `scientific-critical-thinking` skill rather than into any of its reference files. It is kept
> whole so it can move to `ablation-planning` when that skill is built; until then `peer-review`
> is its nearest correct home, since these are the criteria a reviewer applies. When it moves,
> delete this file rather than leaving a copy behind.

Everything below judges *evidence already produced*. Planning which ablations to run in the first
place is a different question and will belong to `ablation-planning`.

## Evidence hierarchy for empirical ML claims

Strongest to weakest:

1. Independently reproduced, multi-seed results across labs
2. Well-controlled experiments with fair baselines and ablations
3. Large-scale benchmark evaluations with variance / CI reporting
4. Controlled comparisons on standard public benchmarks
5. Single-run results on a single benchmark
6. Qualitative case studies or cherry-picked examples
7. Intuition or expert opinion

**A higher rung is not automatically better.** A well-designed single-benchmark experiment can be
stronger evidence than a poorly-controlled large-scale evaluation. Judge the control, not the scale.

## Control conditions

A comparison is only as good as what it is against. Ask which of these exist:

- **Unmodified baseline** — the method without the contribution, everything else identical
- **Ablated variant** — the contribution removed or replaced, capacity held fixed
- **No-op control** — a change that should *not* help; if it does, the story is wrong

The third is the one authors skip and reviewers ask for.

## Downgrade the claim for

- Weak or unfair baselines — in particular a tuned proposed method against a default-configured
  baseline, which is the most common unfair comparison in the field
- Inconsistency across seeds or datasets
- Indirectness — the wrong benchmark, task, or metric for the claim being made
- Imprecision — no variance or CIs, a single seed, a small test set
- Data leakage, or evidence of publication bias

## Upgrade the claim for

- Large, consistent gains across benchmarks rather than one
- A scaling or dose-response trend with data or model size
- Confounds that, if present, would *reduce* rather than inflate the observed gain

## Convergence

**Stronger when** multiple independent replications agree, across different groups, settings and
methodologies, and when mechanistic and empirical evidence align.

**Weaker when** it is a single study from a single group, the literature contains contradictory
findings, publication bias is evident, or nobody has attempted replication.

## Statistical review checklist

Apply when reviewing benchmark and ablation results:

- **Sample size and power** — adequate, and stated
- **Assumption compliance** — the test's assumptions actually hold for this data
- **Test appropriateness** — the right test for the design, not the familiar one
- **Statistical conclusion validity** — are the inferences the numbers support the ones being drawn
- **Measurement** — direct measures or proxies, and if proxies, is the gap acknowledged
