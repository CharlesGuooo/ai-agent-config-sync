# Reproducibility and Reporting Standards for AI/ML Research

This document catalogs major reproducibility and reporting standards used across AI, machine learning, and computer science research. When reviewing submissions, verify that authors have followed the appropriate guidelines for their contribution type (empirical model, dataset, benchmark, systems artifact) and venue.

## Machine Learning Reproducibility Checklists

### NeurIPS Reproducibility Checklist / Paper Checklist
**Purpose:** Empirical ML papers (models, training, evaluation) at major ML venues
**Key Requirements:**
- Claims in abstract/intro match theoretical and experimental results
- Full set of assumptions and complete proofs for theoretical results
- Training details: data splits, hyperparameters, how they were chosen, optimizer
- Compute reporting (hardware type, memory, wall-clock time, number of runs)
- Code and data disclosed, or clear justification for not disclosing
- Error bars / variance reported and how they were computed (seeds, runs)
- Existing assets (datasets, models, code) properly credited and licensed
- Limitations and potential negative societal impacts discussed

**Reference:** https://neurips.cc/public/guides/PaperChecklist

### ML Reproducibility Checklist (Pineau et al.)
**Purpose:** Any empirical machine learning contribution; basis for many venue checklists
**Key Requirements:**
- Clear description of the mathematical setting, algorithm, and model
- Description of computing infrastructure used
- Average runtime for each result or estimated energy cost
- Number of parameters in each model
- Bounds for each hyperparameter and the method used to select final values
- Exact number of training/evaluation runs
- A description of how results were aggregated (mean, best-of, variance)
- Link to downloadable source code, with specification of dependencies
- Description of data collection / preprocessing / splits, and access

**Reference:** https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf

## Model and Dataset Documentation

### Model Cards
**Purpose:** Transparent documentation of trained models and their intended use
**Key Requirements:**
- Model details (architecture, version, training date, owners)
- Intended use and out-of-scope / misuse cases
- Training data and evaluation data described
- Metrics and decision thresholds, with disaggregated evaluation
- Quantitative results broken down by relevant subgroups
- Ethical considerations, caveats, and known limitations

**Reference:** https://arxiv.org/abs/1810.03993

### Datasheets for Datasets
**Purpose:** Documentation accompanying datasets
**Key Requirements:**
- Motivation (why the dataset was created, by whom, funding)
- Composition (what instances represent, number, labels, missing data)
- Collection process (how data was acquired, sampling, consent)
- Preprocessing / cleaning / labeling steps
- Uses (tasks the dataset is/could be used for, tasks to avoid)
- Distribution and licensing
- Maintenance (who maintains, update and versioning plan)

**Reference:** https://arxiv.org/abs/1803.09010

### Data Statements (for NLP)
**Purpose:** Documenting the provenance and demographics of language datasets
**Key Requirements:**
- Curation rationale and language variety
- Speaker and annotator characteristics
- Speech situation and text characteristics
- Recording / collection quality
- Known limitations of representativeness

**Reference:** https://aclanthology.org/Q18-1041/

## Code, Data, and Artifact Availability

### Code and Data Availability
**Purpose:** Enabling independent replication of computational results
**Key Requirements:**
- Public repository (or anonymized repo during review) for training/eval code
- Dependency specification (requirements.txt, environment.yml, Dockerfile, lockfile)
- Exact commands and configs to reproduce each reported result
- Dataset access, versioning, and splits, or scripts to regenerate them
- Random seeds and instructions for deterministic execution where feasible
- Persistent archival with a DOI (Zenodo, figshare) for the release used

**Reference:** https://www.acm.org/publications/policies/artifact-review-and-badging-current

### ACM Artifact Review and Badging
**Purpose:** Independent evaluation of research artifacts by a committee
**Key Requirements:**
- Artifact packaged with documentation and a getting-started guide
- "Artifacts Available" - placed in a public archival repository
- "Artifacts Evaluated - Functional" - complete, documented, and exercisable
- "Artifacts Evaluated - Reusable" - well documented for reuse and extension
- "Results Reproduced" - key results independently obtained by evaluators
- Clear mapping from artifact steps to the paper's tables/figures

**Reference:** https://www.acm.org/publications/policies/artifact-review-and-badging-current

## Experimental Setup and Compute Reporting

### Experimental Setup and Compute
**Purpose:** Making empirical results interpretable and comparable
**Key Requirements:**
- Datasets, train/validation/test splits, and preprocessing fully specified
- Baselines described with sources; comparable tuning budget across methods
- Hyperparameter search space, method, and budget reported
- Hardware (GPU/TPU/CPU type, count, memory) and software versions
- Wall-clock training/inference time and total compute (e.g., GPU-hours)
- Ablations isolating the contribution of each component
- Number of runs/seeds and how final numbers were selected

**Reference:** https://arxiv.org/abs/2003.12206

### Efficiency and Compute Transparency ("Green AI")
**Purpose:** Reporting the computational cost of results
**Key Requirements:**
- Report floating-point operations or GPU-hours for main experiments
- Report model size (parameters) and inference cost
- Report hyperparameter search cost, not just the final run
- Where relevant, estimate energy consumption / carbon footprint

**Reference:** https://arxiv.org/abs/1907.10597

## Statistical Rigor and Variance Reporting

### Statistical Significance and Variance Reporting
**Purpose:** Distinguishing real improvements from noise
**Key Requirements:**
- Multiple runs with different random seeds for stochastic methods
- Report mean and a measure of spread (standard deviation, confidence interval)
- State how many runs and how they were aggregated (mean vs. best-of-N)
- Significance testing for claimed improvements, with correction for multiple comparisons
- Distinguish practical (effect-size) significance from statistical significance
- Report full score distributions, not just the maximum

**Reference:** https://arxiv.org/abs/2109.14545

## Pre-Registration and Open Science

### Pre-Registration
**Purpose:** Reducing HARKing and selective reporting in empirical studies
**Key Requirements:**
- Hypotheses and primary evaluation metrics fixed before running experiments
- Analysis plan and success criteria specified in advance
- Clear separation of confirmatory vs. exploratory results
- Deviations from the plan documented and justified

**Reference:** https://preregister.science/

## General Principles Across Standards

### Common Requirements
1. **Transparency:** All methods, models, data, and analyses fully described
2. **Reproducibility:** Sufficient detail (code, configs, seeds) for independent replication
3. **Availability:** Code and data shared or archived with a persistent identifier
4. **Pre-Specification:** Hypotheses and metrics fixed in advance where applicable
5. **Attribution:** Datasets, models, and code properly cited and licensed
6. **Conflicts of Interest:** Disclosed for all authors
7. **Statistical Rigor:** Variance reported over seeds/runs; comparisons tested
8. **Completeness:** All results reported, including negative and ablation results

### Red Flags for Non-Compliance
- Methods section lacks critical details (splits, hyperparameters, optimizer)
- No mention of following a reproducibility checklist
- Code/data availability statement missing or vague ("available upon request")
- No repository, seeds, or configs for computational results
- Single run with no variance reported over seeds
- Compute and hardware not reported; runtime and cost unknown
- Baselines under-tuned relative to the proposed method
- Missing search & screening flow for a survey/systematic review
- Selective reporting of results (best-of-N without disclosure)

## How to Use This Reference

When reviewing a submission:
1. Identify the contribution type (empirical model, dataset, benchmark, systems artifact, theory)
2. Find the relevant reporting standard(s) and venue checklist
3. Check if authors completed and honored the venue's reproducibility checklist
4. Verify that key requirements are addressed (code, data, compute, seeds, variance)
5. Note any missing elements in your review
6. Suggest the appropriate standard if not mentioned

Many venues require authors to complete a reproducibility checklist at submission and offer artifact-evaluation badges. Reviewers should verify compliance even if a checklist was submitted.
