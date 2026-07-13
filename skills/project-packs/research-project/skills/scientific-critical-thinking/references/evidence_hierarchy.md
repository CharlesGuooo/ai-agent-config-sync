# Evidence Hierarchy and Quality Assessment

## Evidence Hierarchy for Computational Claims (CS/ML)

### Level 1: Independently Reproduced Results (Across Groups and Seeds)
**Description:** A finding confirmed by independent teams, on independent codebases, across many random seeds and data splits.

**Strengths:**
- Combines multiple independent runs for greater confidence
- Reduces impact of single-run or single-implementation anomalies
- Can identify which effects survive across setups
- Quantifies the overall effect size and its variance

**Weaknesses:**
- Quality depends on the underlying runs ("garbage in, garbage out")
- Publication bias toward positive results can distort the picture
- Heterogeneity in setups may make pooling inappropriate
- Can mask important differences between implementations

**Critical evaluation:**
- Was the reproduction truly independent (separate code, separate team)?
- Were the same datasets, splits, and metrics used?
- Was reproduction attempted across multiple seeds?
- Was variance across seeds and setups explored?
- Was reporting bias assessed (are failed reproductions visible)?
- Were appropriate aggregation methods used?

### Level 2: Controlled Experiments with Strong Baselines and Ablations
**Description:** Experiments that isolate the contribution of a component by comparing against strong baselines and ablated variants under matched conditions.

**Strengths:**
- Gold standard for attribution/causal claims about *what* drives a result
- Controls for confounds (data, compute, tuning) by matching them
- Isolates the effect of a single change via ablation
- Enables causal inference about the proposed component

**Weaknesses:**
- May be expensive or infeasible at large scale
- Artificial or small-scale settings may limit generalization
- Often run under one budget with selected hyperparameters
- Compute- and engineering-intensive

**Critical evaluation:**
- Were baselines strong, current, and equally tuned?
- Was compute/hyperparameter budget matched across conditions?
- Were ablations comprehensive (one factor changed at a time)?
- Was the sample of seeds/runs adequate for a powered comparison?
- Was any run excluded, and on what basis?
- Do the results generalize beyond the tested setting?

### Level 3: Large-Scale Benchmark Evaluations with Variance Reporting
**Description:** Evaluations across many datasets/tasks, reporting means with variance or confidence intervals.

**Types:**
- **Multi-benchmark:** Evaluated across a broad suite of tasks
- **Held-out:** Evaluated on splits not touched during development

**Strengths:**
- Can characterize behavior across many conditions
- Establishes breadth of applicability
- Can report distributional results (mean, variance, CIs)
- More scalable than exhaustive controlled experiments

**Weaknesses:**
- Susceptible to confounds (data leakage, tuning on the test suite)
- Selection of benchmarks can bias conclusions
- Benchmark saturation can bias results
- Cannot by itself prove *why* a method works

**Critical evaluation:**
- Were benchmarks comparable and standard for the claim?
- Was the metric measured reliably and consistently?
- Was the evaluation protocol complete and disclosed?
- Were confounds (leakage, contamination) measured and controlled?
- Was evaluation blind to the test set during development?

### Level 4: Multi-Seed Results on a Single Benchmark
**Description:** Repeated runs on one dataset/task, reporting spread across seeds.

**Strengths:**
- Efficient for characterizing run-to-run variability
- Relatively quick and inexpensive
- Can study sensitivity to initialization and data order
- Useful for generating hypotheses

**Weaknesses:**
- Cannot establish breadth across tasks
- Susceptible to overfitting a single benchmark
- Choice of the single benchmark is challenging
- Cannot by itself prove general improvement

**Critical evaluation:**
- Were the task and metric defined clearly?
- Was the benchmark representative of the claim's scope?
- Was the number of seeds adequate?
- How was variance reported (std, CI, min/max)?
- Were confounds controlled?
- Could benchmark-specific tuning explain the result?

### Level 5: Single-Run Benchmark Results
**Description:** A single run on a benchmark reported at one point in configuration space.

**Strengths:**
- Quick and inexpensive
- Can indicate feasibility
- Useful for hypothesis generation
- Can cover multiple metrics at once

**Weaknesses:**
- Cannot distinguish signal from seed luck
- Cannot estimate variance
- Selection (best-of-N) bias
- Survivorship of the one reported run

**Critical evaluation:**
- Was the run representative or best-of-many?
- Were metrics validated and standard?
- Could a different seed reverse the finding?
- Is variance acknowledged?

### Level 6: Cherry-Picked Qualitative Examples and Demos
**Description:** Hand-selected outputs or demonstrations shown in a paper, blog post, or figure.

**Strengths:**
- Can reveal new capabilities or failure modes
- Hypothesis-generating
- Illustrates rare or striking phenomena
- Quick to produce

**Weaknesses:**
- No control comparison
- No statistical inference possible
- Highly susceptible to selection bias
- Cannot establish frequency or reliability

**Use:** Primarily for hypothesis generation and illustration.

### Level 7: Intuition and Author Assertion
**Description:** Claims asserted from experience or design reasoning, without measurement.

**Strengths:**
- Synthesizes practitioner experience
- Useful when no evaluation is available yet
- May integrate multiple informal observations

**Weaknesses:**
- Subjective and potentially biased
- May not reflect measured behavior
- Appeal-to-authority risk
- Individual intuition varies

**Use:** Lowest level of evidence; should be supported by measurement when possible.

## Nuances and Limitations of the Hierarchy

### When Lower-Level Evidence Can Be Strong
1. **Well-designed single-benchmark studies** with:
   - Large effects (hard to explain by noise)
   - Monotonic trends (e.g., scaling curves)
   - Consistent findings across configurations
   - A plausible mechanism
   - No obvious confounds

2. **Multiple converging lines of evidence** from different tasks and metrics

3. **Natural experiments** (e.g., pre/post a single controlled change in a system)

### When Higher-Level Evidence Can Be Weak
1. **Poor controlled experiments** with:
   - Weak or under-tuned baselines
   - High run-to-run variance ignored
   - No ablation when feasible
   - Undisclosed conflicts (e.g., tuned on test)

2. **Biased meta-analyses / leaderboards**:
   - Publication bias toward positive results
   - Selective inclusion of favorable runs
   - Inappropriate pooling across incomparable setups
   - Poor search / missing failed reproductions

3. **Not addressing the right question**:
   - Wrong dataset
   - Wrong baseline comparison
   - Wrong metric
   - Too narrow to generalize

## Alternative: Rigor Grading for Computational Evidence

A confidence framework for empirical CS/ML claims assesses evidence quality across four levels, based on reproducibility and experimental rigor rather than study type.

### High Confidence
**Definition:** Very confident that the reported effect is close to the true effect.

**Characteristics:**
- Strong, well-tuned baselines and comprehensive ablations
- Multi-seed results with variance/CIs and significance testing
- Independent reproduction available
- No serious rigor limitations

### Moderate Confidence
**Definition:** Moderately confident; true effect likely close to reported, but could differ.

**Downgrades from high:**
- Weak or under-tuned baselines
- Inconsistency across seeds or benchmarks
- Indirectness (different data/setting than the claim)
- Imprecision (wide CIs, few seeds)
- Reporting bias suspected (best-of-N reporting)

### Low Confidence
**Definition:** Limited confidence; true effect may be substantially different.

**Downgrades:**
- Serious limitations in the above factors
- Single-run results without variance

### Very Low Confidence
**Definition:** Very limited confidence; true effect likely substantially different.

**Characteristics:**
- Very serious limitations
- Intuition or cherry-picked demos only
- Multiple serious flaws (e.g., leakage plus no baseline)

## Reproducibility and Rigor Assessment Criteria

### Internal Validity (Confound Control)
**Questions:**
- Were baselines strong and equally tuned?
- Was compute/hyperparameter budget matched across conditions?
- Were data splits fixed and leak-free?
- Were ablations run to isolate the claimed component?
- Was run-to-run variance reported and non-trivial?
- Were all runs (not just the best) accounted for?
- Were all evaluated metrics reported?

### External Validity (Generalizability)
**Questions:**
- Is the evaluation set representative of the intended use?
- Are the benchmarks too narrow or saturated?
- Is the deployment/inference setting realistic?
- Do results transfer to other datasets or domains?
- Are effects consistent across data slices?

### Statistical Conclusion Validity
**Questions:**
- Were enough seeds/runs used for a powered comparison?
- Were appropriate significance tests applied?
- Were assumptions (independence, distribution) checked?
- Were effect sizes and confidence intervals reported?
- Were multiple comparisons across benchmarks corrected?
- Was the evaluation protocol prespecified?

### Construct Validity (Measurement)
**Questions:**
- Do the metrics actually capture the capability of interest?
- Was the task defined clearly and appropriately?
- Was evaluation blind to the test set during development?
- Were inputs and data provenance documented?
- Was the measurement timing/protocol appropriate?

## Reproducibility Checklists and Tools

### For Different Artifact Types

**Empirical papers:**
- ML Reproducibility Checklist (https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf)
- NeurIPS Paper Checklist (https://neurips.cc/public/guides/PaperChecklist)
- ICML / venue reproducibility guidelines

**Datasets:**
- Datasheets for Datasets (Gebru et al., https://arxiv.org/abs/1803.09010)
- Dataset cards and documented eval splits

**Models:**
- Model Cards (Mitchell et al., https://arxiv.org/abs/1810.03474)

**Leaderboards and results tracking:**
- Papers with Code (https://paperswithcode.com)

**All artifact types:**
- Released code, configs, seeds, and environment specs (containers/lockfiles)

## Domain-Specific Considerations

### Systems and Performance Research
**Hierarchy differs:**
1. Multiple convergent measurements across hardware
2. Mechanistic understanding of the bottleneck
3. Reproducible microbenchmarks and end-to-end runs
4. Established measurement methodology

**Key considerations:**
- Replication across machines essential
- Mechanistic plausibility (profiles, counters)
- Consistency across workloads
- Warmup, variance, and tail-latency reporting

### Natural Language Processing (NLP)
**Additional concerns:**
- Reproducibility crisis around prompts and decoding settings
- Test-set contamination in large pretraining corpora
- Small, noisy gains often over-interpreted
- Metric validity (n-gram overlap vs. human judgment)

**Strong evidence includes:**
- Contamination checks against training data
- Multiple decoding seeds/temperatures
- Multiple benchmarks and metrics
- Human evaluation alongside automatic metrics
- Held-out and out-of-distribution test sets

### Computer Vision (CV)
**Causal-attribution frameworks:**
- Controlled ablations of architecture vs. augmentation vs. data
- Matched training budgets across models
- Directed reasoning about what a change actually affects

**Strong empirical evidence:**
- Consistent gains across datasets and resolutions
- Reporting under matched compute/data
- Robustness and distribution-shift evaluations
- Variance across seeds
- Effects unlikely to be explained by extra tuning

### Reinforcement Learning (RL)
**Challenges:**
- High variance across seeds
- Sensitivity to hyperparameters and implementation details
- Environment/version differences
- Evaluation-protocol ambiguity

**Strengthening evidence:**
- Many seeds with confidence intervals
- Standardized environments and versions
- Reporting learning curves, not just final returns
- Ablations over implementation details
- Multiple environments/tasks

## Synthesizing Evidence Across Studies

### Consistency
**Strong evidence:**
- Multiple papers, different teams
- Different datasets and settings
- Different architectures/approaches converge
- Different metrics agree

**Weak evidence:**
- Single run or single paper
- Only one research group
- Conflicting results
- Reporting bias evident

### Mechanistic/Theoretical Plausibility
**Strengthens evidence:**
- Known mechanism (why the change should help)
- Consistent with established theory
- Monotonic dose-response (e.g., scaling trend)
- Coherent with controlled diagnostics

**Weakens evidence:**
- No plausible mechanism
- Contradicts well-established results
- Theoretical implausibility

### Temporality / Directionality
**Essential for attribution:**
- The intervention must precede the measured effect
- Correlational leaderboard gaps cannot establish it
- Reverse explanations (e.g., more compute, not the method) must be ruled out

### Specificity
**Moderate indicator:**
- A specific change → specific effect strengthens attribution
- But lack of specificity doesn't rule out an effect
- Most changes affect multiple metrics

### Strength of Effect
**Strong evidence:**
- Large effects unlikely to be explained by noise
- Monotonic trends across a control variable
- All-or-none behavior

**Caution:**
- Small effects may still be real
- Large effects can still be confounded (e.g., extra tuning)

## Red Flags in Evidence Quality

### Experimental Design Red Flags
- No baseline comparison
- Best-of-N runs reported as typical
- No ablation when feasible
- No seeds / single run
- Very few evaluation examples
- Inappropriate or non-standard metrics

### Reporting Red Flags
- Selective metric reporting
- No released code or configs
- Missing training/eval details
- No mention of contamination/leakage checks
- Cherry-picked qualitative examples
- Results don't match the described method

### Interpretation Red Flags
- Causal/attribution language from leaderboard correlations
- Claiming "proof" of superiority
- Ignoring variance and limitations
- Overgeneralizing beyond the tested setting
- Spinning null or negative results
- Post hoc rationalization

### Context Red Flags
- Vendor benchmarks without independent replication
- Single result in isolation
- Contradicts the preponderance of evidence
- No reproduction
- Published without artifact review
- Announcement before any evaluation detail

## Practical Decision Framework

### When Evaluating Evidence, Ask:

1. **What kind of result is this?** (Single run? Multi-seed? Reproduced?)
2. **How rigorously was it run?** (Baselines, ablations, variance)
3. **What does it actually show?** (Metrics and deltas)
4. **How likely is a confound?** (Leakage, unfair budget)
5. **Does it apply to my setting?** (External validity)
6. **How does it fit other evidence?** (Context)
7. **Are the conclusions justified?** (Interpretation)
8. **What are the limitations?** (Uncertainty)

### Making Decisions with Imperfect Evidence

**High-confidence evidence:**
- Strong confidence in acting on the finding
- Reasonable to adopt the method/component

**Moderate-confidence evidence:**
- Provisional conclusions
- Consider alongside other factors
- May warrant a pilot depending on stakes

**Low-confidence evidence:**
- Weak confidence
- Hypothesis-generating
- Insufficient for major decisions alone
- Weigh cost/benefit of running a stronger evaluation

**Very-low-confidence evidence:**
- Very uncertain
- Should not drive decisions alone
- Useful for identifying gaps and follow-up experiments

### When Evidence is Conflicting

**Strategies:**
1. Weight by experimental rigor
2. Look for systematic differences (data, budget, metric)
3. Consider reporting/publication bias
4. Update with the most recent, most rigorous evidence
5. Run or await an independent reproduction
6. Consider whether the question is well-formed

## Communicating Evidence Strength

**Avoid:**
- Absolute certainty ("proves state of the art")
- False balance (equal weight to unequal evidence)
- Ignoring variance and uncertainty
- Cherry-picking runs

**Better:**
- Quantify uncertainty (CIs, seeds)
- Describe strength of evidence
- Acknowledge limitations
- Present the range of results
- Distinguish established from emerging findings
- Be clear about what is/isn't known
